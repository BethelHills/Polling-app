# Supabase Mock Migration Guide

## Overview

This guide shows how to migrate from the current Supabase mocking approach to the new standardized helper functions that reduce duplication and improve maintainability.

## Benefits of Migration

### ✅ **Reduced Code Duplication**
- **Before**: 20-30 lines of mock setup per test
- **After**: 1-2 lines using helper functions

### ✅ **Improved Readability**
- **Before**: Complex mock setup obscures test intent
- **After**: Clear, declarative test setup

### ✅ **Easier Maintenance**
- **Before**: Mock changes require updates in multiple files
- **After**: Changes centralized in helper functions

### ✅ **Consistent Patterns**
- **Before**: Different approaches across test files
- **After**: Standardized patterns everywhere

## Migration Steps

### Step 1: Import Helper Functions

**Before:**
```typescript
import { 
  createAuthMocks, 
  createTestRequest, 
  createUnauthRequest, 
  createInvalidTokenRequest 
} from "../../utils/auth-mock-helper";
```

**After:**
```typescript
import {
  resetAndGetMockClient,
  setupSuccessfulPollCreationScenario,
  setupFailedPollCreationScenario,
  createAuthenticatedRequest,
  createUnauthenticatedRequest,
  createInvalidTokenRequest,
} from "../../utils/supabase-test-helpers";
```

### Step 2: Update beforeEach Setup

**Before:**
```typescript
beforeEach(() => {
  jest.clearAllMocks();

  // Use standardized auth mock helper
  mockSupabaseClient = createAuthMocks({
    authenticated: true,
    pollData: { id: "test-poll-id", title: "Test Poll" },
    pollOptionsData: [],
    pollsListData: []
  });
});
```

**After:**
```typescript
beforeEach(() => {
  // NEW PATTERN: Use standardized reset and get client
  mockSupabaseClient = resetAndGetMockClient();
});
```

### Step 3: Replace Manual Mock Setup

**Before:**
```typescript
it("should create poll successfully", async () => {
  // Manual mock setup
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-123", email: "test@example.com" } },
    error: null
  });

  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table === "polls") {
      return {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "poll-123", title: "Test Poll" },
              error: null
            })
          })
        })
      };
    }
    // More complex setup...
  });

  // Test code...
});
```

**After:**
```typescript
it("should create poll successfully", async () => {
  // NEW PATTERN: Use scenario helper
  setupSuccessfulPollCreationScenario(mockSupabaseClient);

  // Test code...
});
```

### Step 4: Replace Request Creation

**Before:**
```typescript
const request = createTestRequest({
  body: {
    title: "Test Poll",
    options: ["Option 1", "Option 2"]
  }
});
```

**After:**
```typescript
const request = createAuthenticatedRequest({
  body: {
    title: "Test Poll",
    options: ["Option 1", "Option 2"]
  }
});
```

## Common Migration Patterns

### Authentication Setup

| Scenario | Old Pattern | New Pattern |
|----------|-------------|-------------|
| Successful Auth | Manual `auth.getUser` mock | `setupSuccessfulAuth(mockSupabaseClient)` |
| Failed Auth | Manual `auth.getUser` mock | `setupFailedAuth(mockSupabaseClient)` |
| Custom User | Manual user object setup | `setupSuccessfulAuth(mockSupabaseClient, customUser)` |

### Database Operations

| Scenario | Old Pattern | New Pattern |
|----------|-------------|-------------|
| Successful Poll Creation | Complex `from` mock setup | `setupSuccessfulPollCreationScenario(mockSupabaseClient)` |
| Database Error | Manual error mock setup | `setupPollCreationWithDatabaseError(mockSupabaseClient)` |
| Custom Data | Manual data setup | `setupSuccessfulPollCreationScenario(mockSupabaseClient, customData)` |

### Request Creation

| Scenario | Old Pattern | New Pattern |
|----------|-------------|-------------|
| Authenticated Request | `createTestRequest()` | `createAuthenticatedRequest()` |
| Unauthenticated Request | `createUnauthRequest()` | `createUnauthenticatedRequest()` |
| Invalid Token Request | `createInvalidTokenRequest()` | `createInvalidTokenRequest()` |

## Available Helper Functions

### Authentication Helpers
- `setupSuccessfulAuth(client, user?)` - Setup successful authentication
- `setupFailedAuth(client, error?)` - Setup failed authentication
- `setupAuth(client, config)` - Setup auth with custom config

### Database Scenario Helpers
- `setupSuccessfulPollCreationScenario(client, pollData?)` - Complete successful poll creation
- `setupFailedPollCreationScenario(client, error?)` - Complete failed poll creation
- `setupPollCreationWithDatabaseError(client, error?)` - Poll creation with DB error
- `setupSuccessfulPollsFetchScenario(client, pollsData?)` - Complete successful polls fetch

### Request Helpers
- `createAuthenticatedRequest(options?)` - Create authenticated request
- `createUnauthenticatedRequest(options?)` - Create unauthenticated request
- `createInvalidTokenRequest(options?)` - Create request with invalid token

### Utility Helpers
- `resetAndGetMockClient()` - Reset mocks and get fresh client
- `setupDatabaseOperation(client, config)` - Setup generic database operation
- `setupMultipleDatabaseOperations(client, configs)` - Setup multiple operations

## Migration Checklist

### For Each Test File:

- [ ] **Import new helper functions**
- [ ] **Update beforeEach to use `resetAndGetMockClient()`**
- [ ] **Replace manual auth setup with helper functions**
- [ ] **Replace manual database setup with scenario helpers**
- [ ] **Replace request creation with helper functions**
- [ ] **Remove old auth-mock-helper imports**
- [ ] **Test the migrated file**
- [ ] **Update test descriptions if needed**

### For the Project:

- [ ] **Migrate 2-3 test files as proof of concept**
- [ ] **Verify all tests still pass**
- [ ] **Gradually migrate remaining test files**
- [ ] **Remove old auth-mock-helper.ts when no longer used**
- [ ] **Update documentation**

## Example Migration

See `__tests__/api/polls/route-fixed-migrated.test.ts` for a complete example of a migrated test file.

## Rollback Plan

If you need to rollback:
1. Keep the old `auth-mock-helper.ts` file
2. Revert test files to use old imports
3. Remove new helper functions
4. All tests should continue working

## Support

If you encounter issues during migration:
1. Check the template file for correct usage patterns
2. Ensure all imports are correct
3. Verify helper function parameters
4. Test one file at a time

The new system is designed to be backward compatible, so you can migrate gradually without breaking existing tests.