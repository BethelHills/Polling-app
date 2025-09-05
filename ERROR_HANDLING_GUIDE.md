# 🛡️ Error Handling Guide

## 🎯 **Comprehensive Error Management**

Your polling application now has **enterprise-grade error handling** with proper HTTP status codes, detailed error messages, and consistent error responses across all APIs.

### **✅ Error Handling Features:**

#### **1. 🔍 Database Error Detection**

- **Unique Constraint Violations** (23505): Duplicate vote prevention
- **Foreign Key Violations** (23503): Invalid references
- **Check Constraint Violations** (23514): Data validation failures
- **Not Null Violations** (23502): Missing required fields
- **Invalid Text Representation** (22P02): Format errors

#### **2. 🚨 HTTP Status Code Mapping**

- **200 OK**: Successful operations
- **201 Created**: Resource creation
- **400 Bad Request**: Validation errors, invalid data
- **401 Unauthorized**: Authentication failures
- **403 Forbidden**: Authorization failures
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate entries (like duplicate votes)
- **422 Unprocessable Entity**: Complex validation errors
- **500 Internal Server Error**: Unexpected server errors

#### **3. 🎯 Specialized Error Handlers**

##### **Vote-Specific Errors**

```typescript
// Handles unique constraint violations for votes
handleVoteError(error);
// Returns 409 Conflict for duplicate votes
// Returns 500 for other database errors
```

##### **Poll-Specific Errors**

```typescript
// Handles poll-related database errors
handlePollError(error);
// Returns 400 for invalid references
// Returns 500 for other database errors
```

##### **Authentication Errors**

```typescript
// Handles JWT and auth failures
handleAuthError("No token provided");
// Returns 401 Unauthorized
```

##### **Authorization Errors**

```typescript
// Handles permission failures
handleAuthorizationError("Access denied");
// Returns 403 Forbidden
```

### **🔧 Implementation Examples:**

#### **Vote API Error Handling**

```typescript
// Before (basic error handling)
if (voteError) {
  return NextResponse.json(
    { success: false, message: "Failed to submit vote" },
    { status: 500 },
  );
}

// After (comprehensive error handling)
if (voteError) {
  return handleVoteError(voteError);
  // Automatically handles:
  // - 409 Conflict for duplicate votes
  // - 500 for other database errors
  // - Proper error messages and codes
}
```

#### **Authentication Error Handling**

```typescript
// Before
if (!token) {
  return NextResponse.json(
    { success: false, message: "Unauthorized" },
    { status: 401 },
  );
}

// After
if (!token) {
  return handleAuthError("No token provided");
  // Consistent error format with proper status code
}
```

### **📊 Error Response Format**

#### **Standard Error Response**

```json
{
  "success": false,
  "message": "You have already voted on this poll",
  "code": "DUPLICATE_VOTE"
}
```

#### **Validation Error Response**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "title",
      "message": "Title must be at least 3 characters"
    }
  ]
}
```

#### **Success Response**

```json
{
  "success": true,
  "message": "Vote submitted successfully!",
  "data": {
    "vote": { ... },
    "poll": { ... }
  }
}
```

### **🛠️ Error Handler Utility Functions**

#### **Core Error Handlers**

```typescript
import {
  handleDatabaseError,
  handleAuthError,
  handleAuthorizationError,
  handleValidationError,
  handleNotFoundError,
  handleServerError,
  createSuccessResponse,
  handleVoteError,
  handlePollError,
  handleApiError,
  withErrorHandling,
} from "@/lib/error-handler";
```

#### **Database Error Codes**

```typescript
export const DB_ERROR_CODES = {
  UNIQUE_VIOLATION: "23505", // Duplicate entries
  FOREIGN_KEY_VIOLATION: "23503", // Invalid references
  CHECK_VIOLATION: "23514", // Data validation
  NOT_NULL_VIOLATION: "23502", // Missing required fields
  INVALID_TEXT_REPRESENTATION: "22P02", // Format errors
};
```

#### **HTTP Status Codes**

```typescript
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};
```

### **🎯 Specific Error Scenarios**

#### **1. Duplicate Vote Prevention**

```typescript
// When user tries to vote twice
POST /api/polls/{id}/vote
// Response: 409 Conflict
{
  "success": false,
  "message": "You have already voted on this poll",
  "code": "DUPLICATE_VOTE"
}
```

#### **2. Invalid Poll Reference**

```typescript
// When poll doesn't exist
GET /api/polls/invalid-id/vote
// Response: 404 Not Found
{
  "success": false,
  "message": "Poll not found",
  "code": "NOT_FOUND"
}
```

#### **3. Authentication Failure**

```typescript
// When no token provided
POST /api/polls/{id}/vote
// Response: 401 Unauthorized
{
  "success": false,
  "message": "No token provided",
  "code": "AUTH_ERROR"
}
```

#### **4. Authorization Failure**

```typescript
// When user tries to edit someone else's poll
PUT /api/polls/{id}/manage
// Response: 403 Forbidden
{
  "success": false,
  "message": "Access denied - You can only edit your own polls",
  "code": "AUTHORIZATION_ERROR"
}
```

#### **5. Validation Errors**

```typescript
// When poll data is invalid
POST /api/polls
{
  "title": "ab",  // Too short
  "options": []   // Too few options
}
// Response: 400 Bad Request
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "title",
      "message": "Title must be at least 3 characters"
    },
    {
      "field": "options",
      "message": "At least 2 options are required"
    }
  ]
}
```

### **🚀 Advanced Error Handling**

#### **Async Error Wrapper**

```typescript
// Wrap API handlers with automatic error handling
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Your API logic here
  // Errors are automatically caught and handled
});
```

#### **Custom Error Context**

```typescript
// Provide context for better error logging
try {
  // API logic
} catch (error) {
  return handleApiError(error, "Vote API");
  // Logs: "Vote API error: ..."
}
```

### **📈 Benefits of This Error Handling System**

#### **1. Consistency**

- ✅ Uniform error response format across all APIs
- ✅ Standardized HTTP status codes
- ✅ Consistent error messages

#### **2. Developer Experience**

- ✅ Clear error codes for debugging
- ✅ Detailed validation error messages
- ✅ Easy to understand error responses

#### **3. User Experience**

- ✅ Meaningful error messages
- ✅ Proper HTTP status codes for frontend handling
- ✅ Graceful error recovery

#### **4. Security**

- ✅ No sensitive information leaked in errors
- ✅ Proper authentication/authorization error handling
- ✅ Input validation with detailed feedback

#### **5. Monitoring & Debugging**

- ✅ Structured error logging
- ✅ Error codes for tracking
- ✅ Context-aware error messages

### **🔧 Frontend Integration**

#### **Error Handling in React**

```typescript
const handleVote = async (pollId: string, optionId: string) => {
  try {
    const response = await fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ option_id: optionId }),
    });

    const result = await response.json();

    if (!result.success) {
      // Handle specific error types
      switch (response.status) {
        case 409:
          setError("You have already voted on this poll");
          break;
        case 401:
          setError("Please log in to vote");
          break;
        case 404:
          setError("Poll not found");
          break;
        default:
          setError(result.message || "An error occurred");
      }
      return;
    }

    // Handle success
    setVoteResult(result.data);
  } catch (error) {
    setError("Network error occurred");
  }
};
```

### **📊 Error Monitoring**

#### **Error Tracking Integration**

```typescript
// Log errors for monitoring services
console.error("API Error:", {
  endpoint: "/api/polls/vote",
  status: response.status,
  error: result,
  timestamp: new Date().toISOString(),
  user_id: userId,
});
```

Your polling application now has **production-ready error handling** that provides excellent developer and user experience while maintaining security and consistency! 🎉

## 📁 **Files Updated:**

- `lib/error-handler.ts` - Comprehensive error handling utility
- `app/api/polls/[id]/vote/route.ts` - Updated with proper error handling
- `ERROR_HANDLING_GUIDE.md` - This documentation
