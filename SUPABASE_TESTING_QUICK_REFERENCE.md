# Supabase Testing Quick Reference

## 🚀 Quick Start

```typescript
import {
  resetAndGetMockClient,
  setupSuccessfulPollCreationScenario,
  createAuthenticatedRequest,
} from "../utils/supabase-test-helpers";

describe("My Test", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = resetAndGetMockClient();
  });

  it("should work", async () => {
    setupSuccessfulPollCreationScenario(mockSupabaseClient);
    const request = createAuthenticatedRequest();
    // Test code...
  });
});
```

## 📋 Common Patterns

### Authentication Setup

```typescript
// ✅ Successful authentication
setupSuccessfulAuth(mockSupabaseClient);

// ✅ Failed authentication
setupFailedAuth(mockSupabaseClient);

// ✅ Custom user
setupSuccessfulAuth(mockSupabaseClient, {
  id: "custom-user-id",
  email: "custom@example.com"
});
```

### Database Operations

```typescript
// ✅ Successful poll creation
setupSuccessfulPollCreationScenario(mockSupabaseClient);

// ✅ Poll creation with custom data
setupSuccessfulPollCreationScenario(mockSupabaseClient, {
  id: "custom-poll-id",
  title: "Custom Poll"
});

// ✅ Database error
setupPollCreationWithDatabaseError(mockSupabaseClient);

// ✅ Successful polls fetch
setupSuccessfulPollsFetchScenario(mockSupabaseClient);
```

### Request Creation

```typescript
// ✅ Authenticated request
const request = createAuthenticatedRequest({
  body: { title: "Test Poll", options: ["A", "B"] }
});

// ✅ Unauthenticated request
const request = createUnauthenticatedRequest();

// ✅ Invalid token request
const request = createInvalidTokenRequest({
  token: "invalid-token"
});
```

## 🎯 Complete Test Examples

### POST Endpoint Test

```typescript
it("should create poll successfully", async () => {
  setupSuccessfulPollCreationScenario(mockSupabaseClient);
  
  const request = createAuthenticatedRequest({
    body: {
      title: "Test Poll",
      options: ["Option 1", "Option 2"]
    }
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(201);
  expect(data.success).toBe(true);
});
```

### GET Endpoint Test

```typescript
it("should fetch polls successfully", async () => {
  setupSuccessfulPollsFetchScenario(mockSupabaseClient);

  const response = await GET();
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(data.polls).toHaveLength(2);
});
```

### Error Handling Test

```typescript
it("should handle database errors", async () => {
  setupPollCreationWithDatabaseError(mockSupabaseClient, {
    message: "Database connection failed"
  });

  const request = createAuthenticatedRequest();

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(500);
  expect(data.success).toBe(false);
});
```

## 🔧 Advanced Usage

### Custom Database Operations

```typescript
// ✅ Generic database operation
setupDatabaseOperation(mockSupabaseClient, {
  table: "polls",
  operation: "select",
  data: [{ id: "poll-1", title: "Poll 1" }],
  error: null
});

// ✅ Multiple operations
setupMultipleDatabaseOperations(mockSupabaseClient, [
  {
    table: "polls",
    operation: "insert",
    data: { id: "poll-1", title: "Poll 1" }
  },
  {
    table: "poll_options",
    operation: "insert",
    data: []
  }
]);
```

### Custom Scenarios

```typescript
// ✅ Custom poll creation scenario
setupSuccessfulPollCreationScenario(mockSupabaseClient, {
  id: "custom-poll-id",
  title: "Custom Poll",
  description: "A custom test poll",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  total_votes: 0,
  options: []
});

// ✅ Custom polls fetch scenario
const customPolls = [
  {
    id: "poll-1",
    title: "Custom Poll 1",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    total_votes: 10,
    options: [
      { id: "option-1", votes: 6 },
      { id: "option-2", votes: 4 }
    ]
  }
];

setupSuccessfulPollsFetchScenario(mockSupabaseClient, customPolls);
```

## 📚 Available Helper Functions

### Authentication Helpers
- `setupSuccessfulAuth(client, user?)`
- `setupFailedAuth(client, error?)`
- `setupAuth(client, config)`

### Scenario Helpers
- `setupSuccessfulPollCreationScenario(client, pollData?)`
- `setupFailedPollCreationScenario(client, error?)`
- `setupPollCreationWithDatabaseError(client, error?)`
- `setupPollCreationWithOptionsError(client, error?)`
- `setupSuccessfulPollsFetchScenario(client, pollsData?)`
- `setupFailedPollsFetchScenario(client, error?)`

### Request Helpers
- `createAuthenticatedRequest(options?)`
- `createUnauthenticatedRequest(options?)`
- `createInvalidTokenRequest(options?)`

### Utility Helpers
- `resetAndGetMockClient()`
- `setupDatabaseOperation(client, config)`
- `setupMultipleDatabaseOperations(client, configs)`

## 🚨 Common Pitfalls

### ❌ Don't forget to reset mocks
```typescript
// ❌ Wrong
beforeEach(() => {
  mockSupabaseClient = getMockSupabaseClient();
});

// ✅ Correct
beforeEach(() => {
  mockSupabaseClient = resetAndGetMockClient();
});
```

### ❌ Don't mix old and new patterns
```typescript
// ❌ Wrong - mixing patterns
setupSuccessfulPollCreationScenario(mockSupabaseClient);
mockSupabaseClient.auth.getUser.mockResolvedValue(/* ... */);

// ✅ Correct - use helpers consistently
setupSuccessfulPollCreationScenario(mockSupabaseClient);
```

### ❌ Don't forget to import helpers
```typescript
// ❌ Wrong - missing imports
setupSuccessfulPollCreationScenario(mockSupabaseClient);

// ✅ Correct - proper imports
import { setupSuccessfulPollCreationScenario } from "../utils/supabase-test-helpers";
```

## 🎉 Benefits

- **90% less boilerplate code**
- **Consistent patterns across all tests**
- **Easy to maintain and update**
- **Clear, readable test setup**
- **Type-safe configuration**

## 📖 Full Documentation

See `MIGRATION_GUIDE.md` for complete migration instructions and `__tests__/templates/standardized-test-template.test.ts` for comprehensive examples.
