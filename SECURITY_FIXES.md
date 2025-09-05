# Critical Security Fixes - Implementation Guide

## 🚨 Immediate Fixes Required

### 1. Fix Authentication Token Validation

**File**: `app/api/polls/route.ts`

**Current Issue**: Weak token validation

```typescript
const token = request.headers.get("authorization")?.replace("Bearer ", "");
```

**Fix**:

```typescript
// Enhanced token validation
const authHeader = request.headers.get("authorization");
if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return NextResponse.json(
    { success: false, message: "Invalid authorization header format" },
    { status: 401 },
  );
}

const token = authHeader.replace("Bearer ", "").trim();
if (!token || token.length < 10) {
  // Basic token length check
  return NextResponse.json(
    { success: false, message: "Invalid token format" },
    { status: 401 },
  );
}
```

### 2. Fix Race Condition in Voting

**File**: `app/api/polls/[id]/vote/route.ts`

**Current Issue**: Check-then-insert race condition

```typescript
// Remove this entire block - it's a race condition!
const { data: existingVote, error: voteCheckError } = await supabaseServerClient
  .from("votes")
  .select("id")
  .eq("poll_id", pollId)
  .eq("user_id", userId)
  .single();

if (existingVote) {
  return NextResponse.json(
    { success: false, message: "You have already voted on this poll" },
    { status: 400 },
  );
}
```

**Fix**: Rely on database constraint

```typescript
// Direct insert with proper error handling
try {
  const { data: vote, error: voteError } = await supabaseServerClient
    .from("votes")
    .insert({
      poll_id: pollId,
      option_id: option_id,
      user_id: userId,
    })
    .select()
    .single();

  if (voteError) {
    if (voteError.code === "23505") {
      // Unique violation
      return NextResponse.json(
        { success: false, message: "You have already voted on this poll" },
        { status: 409 },
      );
    }
    return handleVoteError(voteError);
  }
} catch (error) {
  console.error("Vote insertion error:", error);
  return NextResponse.json(
    { success: false, message: "Failed to submit vote" },
    { status: 500 },
  );
}
```

### 3. Add Input Sanitization

**File**: `lib/validation-schemas.ts`

**Add DOMPurify sanitization**:

```typescript
import DOMPurify from "dompurify";

// Create DOMPurify instance for server-side
const createDOMPurify = () => {
  if (typeof window === "undefined") {
    // Server-side: return a mock DOMPurify that just returns the input
    return {
      sanitize: (html: string) => html.replace(/<[^>]*>/g, ""), // Strip HTML tags
      version: "server-side",
    };
  }
  return DOMPurify;
};

const domPurify = createDOMPurify();

// Enhanced string validation with sanitization
const sanitizedString = z.string().transform((val) => {
  // Sanitize the string using DOMPurify
  return domPurify
    .sanitize(val, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    })
    .trim();
});

// Update schemas to use sanitized strings
export const createPollSchema = z.object({
  title: sanitizedString
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),

  description: sanitizedString
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),

  options: z
    .array(
      sanitizedString
        .min(1, "Option text is required")
        .max(100, "Option must be less than 100 characters"),
    )
    .min(2, "At least 2 options are required")
    .max(10, "Maximum 10 options allowed")
    .refine(
      (options) => {
        const texts = options.map((opt) => opt.trim().toLowerCase());
        return new Set(texts).size === texts.length;
      },
      { message: "Options must be unique" },
    ),
});
```

### 4. Add Request Size Validation

**File**: `app/api/polls/route.ts`

**Add at the beginning of POST function**:

```typescript
export async function POST(request: NextRequest) {
  try {
    // Validate request size
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10000) { // 10KB limit
      return NextResponse.json(
        { success: false, message: "Request too large" },
        { status: 413 }
      )
    }

    const body = await request.json()

    // Validate JSON size
    if (JSON.stringify(body).length > 10000) {
      return NextResponse.json(
        { success: false, message: "Request payload too large" },
        { status: 413 }
      )
    }

    // ... rest of the function
  }
}
```

### 5. Fix Test Authentication Mocks

**File**: `__tests__/api/polls/route.test.ts`

**Replace the mock setup**:

```typescript
// Mock the Supabase server client properly
jest.mock("@/lib/supabaseServerClient", () => {
  const mockGetUser = jest.fn();
  const mockFrom = jest.fn();

  return {
    supabaseServerClient: {
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    },
  };
});

// In each test, setup the mock properly
beforeEach(() => {
  jest.clearAllMocks();

  // Setup successful authentication by default
  const { supabaseServerClient } = require("@/lib/supabaseServerClient");
  supabaseServerClient.auth.getUser.mockResolvedValue({
    data: { user: { id: "user1" } },
    error: null,
  });

  // Setup successful database operations
  supabaseServerClient.from.mockReturnValue({
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: "poll-123", title: "Test Poll" },
          error: null,
        }),
      }),
    }),
  });
});
```

### 6. Add Rate Limiting

**File**: `middleware.ts`

**Ensure rate limiting is applied**:

```typescript
export async function middleware(request: NextRequest) {
  // Apply rate limiting for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    let rateLimitConfig = RateLimitConfigs.GENERAL;

    if (
      request.nextUrl.pathname.includes("/polls") &&
      request.method === "POST"
    ) {
      rateLimitConfig = RateLimitConfigs.CREATE_POLL;
    } else if (request.nextUrl.pathname.includes("/vote")) {
      rateLimitConfig = RateLimitConfigs.VOTE;
    }

    const rateLimitResponse = await rateLimit(rateLimitConfig)(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // ... rest of middleware
}
```

## 🧪 Test Fixes

### Create Security Test Suite

**File**: `__tests__/security/poll-security.test.ts`

```typescript
import "@testing-library/jest-dom";
import { POST } from "@/app/api/polls/route";
import { NextRequest } from "next/server";

describe("Poll API Security Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reject malformed authorization headers", async () => {
    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        Authorization: "InvalidFormat token123",
      },
      body: JSON.stringify({
        title: "Test Poll",
        options: ["Option 1", "Option 2"],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toContain("Invalid authorization header format");
  });

  it("should sanitize HTML in poll titles", async () => {
    // Setup auth mock
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    supabaseServerClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user1" } },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        title: '<script>alert("xss")</script>Test Poll',
        options: ["Option 1", "Option 2"],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.poll.title).toBe("Test Poll"); // HTML should be stripped
  });

  it("should reject oversized requests", async () => {
    const largeTitle = "A".repeat(10000);

    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Length": "15000",
      },
      body: JSON.stringify({
        title: largeTitle,
        options: ["Option 1", "Option 2"],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(413);
    expect(data.message).toContain("Request too large");
  });
});
```

## 📋 Implementation Checklist

- [ ] Fix authentication token validation
- [ ] Remove race condition in voting logic
- [ ] Add input sanitization with DOMPurify
- [ ] Add request size validation
- [ ] Fix test authentication mocks
- [ ] Ensure rate limiting is working
- [ ] Create security test suite
- [ ] Test all fixes thoroughly
- [ ] Update documentation

## 🎯 Priority Order

1. **CRITICAL**: Fix authentication mocks (tests failing)
2. **HIGH**: Remove race condition in voting
3. **HIGH**: Add input sanitization
4. **MEDIUM**: Add request size validation
5. **MEDIUM**: Ensure rate limiting works
6. **LOW**: Create comprehensive security tests

These fixes will significantly improve the security posture of your polling application.
