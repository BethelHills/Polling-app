# Security Review Report - Polling App PR

## Executive Summary

After reviewing the PR that adds server-side authentication and Zod validation to `/app/api/polls/route.ts` with unique vote constraints, I've identified several **critical security issues** and **logic bugs** that need immediate attention.

## 🚨 Critical Issues Found

### 1. **Authentication Bypass in Tests**

- **Issue**: Tests are failing with 401 errors because mocks aren't properly set up
- **Impact**: Could indicate authentication bypass vulnerabilities
- **Status**: ❌ **CRITICAL** - Tests not validating auth properly

### 2. **Missing Input Sanitization**

- **Issue**: While Zod validation exists, there's no HTML sanitization in the validation schema
- **Impact**: Potential XSS vulnerabilities
- **Location**: `lib/validation-schemas.ts`
- **Status**: ⚠️ **HIGH** - XSS risk

### 3. **Inconsistent Error Handling**

- **Issue**: Some endpoints return generic errors while others expose detailed information
- **Impact**: Information disclosure
- **Status**: ⚠️ **MEDIUM** - Information leakage

### 4. **Race Condition in Vote Logic**

- **Issue**: Vote checking and insertion aren't atomic
- **Impact**: Potential duplicate votes despite unique constraints
- **Status**: ⚠️ **MEDIUM** - Race condition

### 5. **Missing Rate Limiting on Critical Endpoints**

- **Issue**: No rate limiting on poll creation or voting
- **Impact**: Spam and abuse potential
- **Status**: ⚠️ **MEDIUM** - Abuse potential

## 🔍 Detailed Analysis

### Authentication Implementation

```typescript
// ✅ GOOD: Server-side token validation
const token = request.headers.get("authorization")?.replace("Bearer ", "");
if (!token) {
  return NextResponse.json(
    { success: false, message: "Unauthorized - No token provided" },
    { status: 401 },
  );
}

const { data: userData, error: userErr } =
  await supabaseServerClient.auth.getUser(token);
if (userErr || !userData?.user) {
  return NextResponse.json(
    { success: false, message: "Unauthorized - Invalid token" },
    { status: 401 },
  );
}
```

**Issues:**

- No token format validation (Bearer prefix handling)
- No token expiration checking
- No rate limiting on auth attempts

### Validation Implementation

```typescript
// ✅ GOOD: Comprehensive Zod validation
export const createPollSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  options: z
    .array(pollOptionSchema)
    .min(2, "At least 2 options are required")
    .max(10, "Maximum 10 options allowed"),
});
```

**Issues:**

- No HTML sanitization
- No SQL injection protection (though Supabase handles this)
- No emoji or special character validation

### Vote Logic Implementation

```typescript
// ⚠️ RACE CONDITION: Check then insert pattern
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

// Insert vote - RACE CONDITION HERE!
const { data: vote, error: voteError } = await supabaseServerClient
  .from("votes")
  .insert({ poll_id: pollId, option_id: option_id, user_id: userId });
```

**Issues:**

- Race condition between check and insert
- Should rely on database unique constraint instead

## 🛡️ Security Hardening Recommendations

### 1. **Fix Authentication Issues**

```typescript
// Add token format validation
const authHeader = request.headers.get("authorization");
if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return NextResponse.json(
    { success: false, message: "Invalid authorization header format" },
    { status: 401 },
  );
}

const token = authHeader.replace("Bearer ", "").trim();
if (!token) {
  return NextResponse.json(
    { success: false, message: "No token provided" },
    { status: 401 },
  );
}
```

### 2. **Add Input Sanitization**

```typescript
import DOMPurify from "dompurify";

const sanitizedString = z.string().transform((val) => {
  return DOMPurify.sanitize(val, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
});
```

### 3. **Fix Race Condition in Voting**

```typescript
// Remove the check, rely on database constraint
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
  // Handle other errors
}
```

### 4. **Add Rate Limiting**

```typescript
// In middleware.ts
if (request.nextUrl.pathname.includes("/polls") && request.method === "POST") {
  const rateLimitResponse = await rateLimit(RateLimitConfigs.CREATE_POLL)(
    request,
  );
  if (rateLimitResponse) return rateLimitResponse;
}
```

### 5. **Improve Error Handling**

```typescript
// Standardize error responses
export const createErrorResponse = (
  message: string,
  code: string,
  status: number,
) => {
  return NextResponse.json({ success: false, message, code }, { status });
};
```

### 6. **Add Request Validation**

```typescript
// Validate request size
const contentLength = request.headers.get("content-length");
if (contentLength && parseInt(contentLength) > 10000) {
  // 10KB limit
  return NextResponse.json(
    { success: false, message: "Request too large" },
    { status: 413 },
  );
}
```

## 🧪 Test Fixes Needed

### 1. **Fix Authentication Mocks**

```typescript
// Proper mock setup
jest.mock("@/lib/supabaseServerClient", () => ({
  supabaseServerClient: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// In test setup
mockSupabaseClient.auth.getUser.mockResolvedValue({
  data: { user: { id: "user1" } },
  error: null,
});
```

### 2. **Add Security Test Cases**

```typescript
describe("Security Tests", () => {
  it("should reject malformed authorization headers", async () => {
    // Test invalid Bearer format
  });

  it("should sanitize HTML in poll titles", async () => {
    // Test XSS prevention
  });

  it("should handle race conditions in voting", async () => {
    // Test concurrent vote attempts
  });
});
```

## 📊 Security Score: C+ (Needs Improvement)

### Current Status:

- ✅ Server-side authentication implemented
- ✅ Zod validation in place
- ✅ Unique vote constraints enforced
- ❌ Input sanitization missing
- ❌ Race conditions present
- ❌ Rate limiting not implemented
- ❌ Tests not properly validating security

### Recommended Actions:

1. **IMMEDIATE**: Fix authentication mocks in tests
2. **HIGH PRIORITY**: Add input sanitization
3. **HIGH PRIORITY**: Fix race condition in voting
4. **MEDIUM PRIORITY**: Implement rate limiting
5. **MEDIUM PRIORITY**: Standardize error handling
6. **LOW PRIORITY**: Add comprehensive security tests

## 🎯 Next Steps

1. Fix the critical authentication issues in tests
2. Implement input sanitization
3. Address race conditions
4. Add rate limiting
5. Create comprehensive security test suite
6. Consider adding request size limits
7. Implement proper logging for security events

This PR has good foundations but needs significant security hardening before production deployment.
