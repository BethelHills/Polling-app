# Vitest Supabase Mocking Setup Guide

## Overview

This guide shows how to set up clean Supabase mocking using Vitest's `vi.mock()` pattern, which is much cleaner than Jest's approach.

## Key Benefits

### ✅ **Cleaner Mock Setup**
- **Before (Jest)**: Complex global mocks in `jest.setup.js`
- **After (Vitest)**: Simple `vi.mock()` at the top of test files

### ✅ **Better Module Isolation**
- Mocks are scoped to individual test files
- No global mock pollution
- Easier to test different scenarios

### ✅ **More Intuitive**
- Mock the actual import path your code uses
- No need to mock internal implementation details
- Clearer what's being mocked

## Setup Instructions

### Step 1: Install Vitest (if not already installed)

```bash
npm install -D vitest
```

### Step 2: Configure Vitest

Create or update `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
```

### Step 3: Create Vitest Setup File

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom';

// Mock Web APIs for Node.js environment
global.Request = class MockRequest {
  constructor(input, init = {}) {
    this.url = typeof input === "string" ? input : input.url;
    this.method = init.method || "GET";
    this.headers = new Headers(init.headers || {});
    this.body = init.body;
  }

  async json() {
    return JSON.parse(this.body || "{}");
  }
};

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || "OK";
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  async json() {
    return JSON.parse(this.body || "{}");
  }
};

global.Headers = class MockHeaders extends Map {
  constructor(init = {}) {
    super();
    if (typeof init === "object") {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key.toLowerCase(), value);
      });
    }
  }

  get(name) {
    return super.get(name.toLowerCase());
  }

  has(name) {
    return super.has(name.toLowerCase());
  }

  set(name, value) {
    return super.set(name.toLowerCase(), value);
  }

  delete(name) {
    return super.delete(name.toLowerCase());
  }
};

// Mock Next.js server components
vi.mock("next/server", () => ({
  NextRequest: global.Request,
  NextResponse: {
    json: (data, init = {}) => {
      const response = new global.Response(JSON.stringify(data), {
        status: init.status || 200,
        statusText: init.statusText || "OK",
        headers: {
          "Content-Type": "application/json",
          ...init.headers,
        },
      });
      response.json = () => Promise.resolve(data);
      return response;
    },
  },
}));

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SECRET_KEY = "test-secret-key";
```

### Step 4: Update Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Usage Patterns

### Basic Test File Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from "@/app/api/polls/route";
import {
  createMockSupabaseClient,
  setupSuccessfulPollCreationScenario,
  createAuthenticatedRequest,
  resetSupabaseMocks,
} from "../utils/vitest-supabase-helpers";

// Mock the Supabase client at the module level
const mockSupabaseClient = createMockSupabaseClient();
vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabaseClient
}));

describe("My API Tests", () => {
  beforeEach(() => {
    resetSupabaseMocks(mockSupabaseClient);
  });

  it("should work", async () => {
    setupSuccessfulPollCreationScenario(mockSupabaseClient);
    const request = createAuthenticatedRequest();
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});
```

### Mocking Different Import Paths

If your app imports Supabase differently, adjust the mock path:

```typescript
// For @/lib/supabase
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

// For @/lib/supabaseClient
vi.mock('@/lib/supabaseClient', () => ({
  supabaseClient: mockSupabaseClient
}));

// For @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));
```

## Helper Functions

### Authentication Setup

```typescript
import {
  setupSuccessfulAuth,
  setupFailedAuth,
  setupAuth,
} from "../utils/vitest-supabase-helpers";

// Successful authentication
setupSuccessfulAuth(mockSupabaseClient);

// Failed authentication
setupFailedAuth(mockSupabaseClient);

// Custom user
setupSuccessfulAuth(mockSupabaseClient, {
  id: "custom-user-id",
  email: "custom@example.com"
});
```

### Database Operations

```typescript
import {
  setupSuccessfulPollCreationScenario,
  setupPollCreationWithDatabaseError,
  setupSuccessfulPollsFetchScenario,
} from "../utils/vitest-supabase-helpers";

// Complete scenarios
setupSuccessfulPollCreationScenario(mockSupabaseClient);
setupPollCreationWithDatabaseError(mockSupabaseClient);
setupSuccessfulPollsFetchScenario(mockSupabaseClient);
```

### Request Creation

```typescript
import {
  createAuthenticatedRequest,
  createUnauthenticatedRequest,
  createInvalidTokenRequest,
} from "../utils/vitest-supabase-helpers";

// Different request types
const authRequest = createAuthenticatedRequest({
  body: { title: "Test Poll", options: ["A", "B"] }
});

const unauthRequest = createUnauthenticatedRequest();
const invalidRequest = createInvalidTokenRequest();
```

## Migration from Jest

### Before (Jest)

```typescript
// jest.setup.js - Global mocks
jest.mock("@/lib/supabaseServerClient", () => ({
  supabaseServerClient: mockSupabaseClient
}));

// Test file
import { supabaseServerClient } from "@/lib/supabaseServerClient";
const mockClient = supabaseServerClient;
```

### After (Vitest)

```typescript
// Test file - Local mocks
const mockSupabaseClient = createMockSupabaseClient();
vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabaseClient
}));
```

## Advantages Over Jest

### 1. **Cleaner Mock Setup**
- No global mock pollution
- Mocks are scoped to test files
- Easier to understand what's being mocked

### 2. **Better Type Safety**
- Vitest has better TypeScript support
- Mock functions are properly typed
- Better IDE integration

### 3. **Faster Execution**
- Vitest is generally faster than Jest
- Better parallel test execution
- Faster watch mode

### 4. **Modern Tooling**
- Built-in ESM support
- Better Vite integration
- Modern JavaScript features

## Example Test Files

See these example files for complete implementations:

- `__tests__/examples/vitest-supabase-example.test.ts` - Complete example
- `__tests__/utils/vitest-supabase-helpers.ts` - Helper functions

## Troubleshooting

### Common Issues

1. **Mock not working**: Ensure the mock path matches your import path exactly
2. **Type errors**: Make sure Vitest types are properly configured
3. **Setup issues**: Check that `vitest.setup.ts` is properly configured

### Debug Tips

```typescript
// Check if mock is working
console.log('Mock client:', mockSupabaseClient);
console.log('Auth mock:', mockSupabaseClient.auth.getUser);

// Verify mock calls
expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith("token");
```

## Next Steps

1. **Set up Vitest** using the configuration above
2. **Migrate one test file** to try the new approach
3. **Gradually migrate** other test files
4. **Remove Jest setup** once migration is complete

The Vitest approach is much cleaner and more maintainable than the current Jest setup!
