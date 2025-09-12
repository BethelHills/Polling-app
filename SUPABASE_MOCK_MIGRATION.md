# Supabase Mock Migration Guide

This guide explains how to migrate from the current scattered Supabase mocking approach to the new centralized system.

## Current Issues

1. **Scattered mocking logic** - Supabase mocks are spread across multiple files
2. **Inconsistent patterns** - Different test files use different approaches
3. **Hard to maintain** - Mock logic is duplicated and hard to update
4. **Complex setup** - Requires manual mock configuration in each test

## New Centralized Approach

### 1. Centralized Mock Files

- `__mocks__/supabaseClient.ts` - Main Supabase client mock
- `__mocks__/supabaseServerClient.ts` - Server-side client mock
- `jest.setup.improved.js` - Simplified Jest setup

### 2. Helper Functions

```typescript
// Setup authentication
setupMockAuth({
  authenticated: true,
  user: { id: "user-123", email: "test@example.com" }
});

// Setup database operations
setupMockDatabase({
  table: "polls",
  operation: "insert",
  data: { id: "poll-123", title: "Test Poll" }
});

// Reset all mocks
resetSupabaseMocks();
```

## Migration Steps

### Step 1: Update Jest Configuration

Replace your current `jest.setup.js` with `jest.setup.improved.js`:

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.improved.js'],
  // ... other config
};
```

### Step 2: Update Test Files

**Before (old approach):**
```typescript
// Complex manual mock setup
jest.mock("@/lib/supabaseServerClient", () => ({
  supabaseServerClient: {
    auth: {
      getUser: jest.fn().mockImplementation((token: string) => {
        // Complex logic here
      })
    },
    from: jest.fn().mockImplementation((table: string) => {
      // More complex logic
    })
  }
}));

// In test
beforeEach(() => {
  jest.clearAllMocks();
  // More setup...
});
```

**After (new approach):**
```typescript
import { setupMockAuth, setupMockDatabase, resetSupabaseMocks } from "../../__mocks__/supabaseClient";

beforeEach(() => {
  resetSupabaseMocks();
});

it("should work", async () => {
  setupMockAuth({ authenticated: true });
  setupMockDatabase({ table: "polls", operation: "insert", data: mockData });
  // Test code...
});
```

### Step 3: Remove Old Mock Files

You can safely remove:
- `__tests__/utils/auth-mock-helper.ts` (replaced by centralized mocks)
- Complex mock setup in individual test files

### Step 4: Update Existing Tests

1. **Replace manual mock setup** with helper functions
2. **Remove duplicate mock logic** from test files
3. **Use consistent patterns** across all tests

## Benefits

### 1. **Cleaner Test Files**
- Less boilerplate code
- Focus on test logic, not mock setup
- Consistent patterns across all tests

### 2. **Easier Maintenance**
- Single place to update mock logic
- Centralized helper functions
- Type-safe mock configuration

### 3. **Better Developer Experience**
- Clear, simple API for setting up mocks
- Automatic mock reset between tests
- Better error messages and debugging

### 4. **More Reliable Tests**
- Consistent mock behavior
- Proper cleanup between tests
- Less prone to mock-related bugs

## Example Migration

### Before
```typescript
describe("API Route Tests", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;

    mockSupabaseClient.auth.getUser.mockImplementation((token: string) => {
      if (token && token.length >= 10) {
        return Promise.resolve({
          data: { user: { id: "test-user-id", email: "test@example.com" } },
          error: null
        });
      }
      return Promise.resolve({
        data: { user: null },
        error: { message: "Invalid token" }
      });
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "polls") {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "test-poll-id", title: "Test Poll" },
                error: null
              })
            })
          })
        };
      }
      // More complex logic...
    });
  });

  it("should create poll", async () => {
    // Test code...
  });
});
```

### After
```typescript
import { setupMockAuth, setupMockDatabase, resetSupabaseMocks } from "../../__mocks__/supabaseClient";

describe("API Route Tests", () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  it("should create poll", async () => {
    setupMockAuth({ authenticated: true });
    setupMockDatabase({
      table: "polls",
      operation: "insert",
      data: { id: "test-poll-id", title: "Test Poll" }
    });
    
    // Test code...
  });
});
```

## Testing the Migration

1. **Run the example test** to verify the new system works:
   ```bash
   npm test -- --testPathPatterns="improved-supabase-mock-example.test.ts"
   ```

2. **Gradually migrate existing tests** one file at a time

3. **Remove old mock files** once migration is complete

## Support

If you encounter issues during migration:
1. Check the example test file for correct usage patterns
2. Ensure all imports are correct
3. Verify Jest configuration is updated
4. Check that mock helper functions are properly exported

The new system is designed to be backward compatible, so you can migrate gradually without breaking existing tests.
