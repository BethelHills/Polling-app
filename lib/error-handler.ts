import { NextResponse } from "next/server";

// Database error codes
export const DB_ERROR_CODES = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  CHECK_VIOLATION: "23514",
  NOT_NULL_VIOLATION: "23502",
  INVALID_TEXT_REPRESENTATION: "22P02",
} as const;

// HTTP status codes
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
} as const;

// Error response interface
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
}

// Success response interface
interface SuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data?: T;
}

/**
 * Handle database errors and return appropriate HTTP responses
 */
export function handleDatabaseError(error: {
  code?: string;
  message?: string;
}): NextResponse<ErrorResponse> {
  console.error("Database error:", error);

  switch (error.code) {
    case DB_ERROR_CODES.UNIQUE_VIOLATION:
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate entry - this record already exists",
          code: error.code,
        },
        { status: HTTP_STATUS.CONFLICT },
      );

    case DB_ERROR_CODES.FOREIGN_KEY_VIOLATION:
      return NextResponse.json(
        {
          success: false,
          message: "Referenced record not found",
          code: error.code,
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );

    case DB_ERROR_CODES.CHECK_VIOLATION:
      return NextResponse.json(
        {
          success: false,
          message: "Data validation failed",
          code: error.code,
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );

    case DB_ERROR_CODES.NOT_NULL_VIOLATION:
      return NextResponse.json(
        {
          success: false,
          message: "Required field is missing",
          code: error.code,
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );

    case DB_ERROR_CODES.INVALID_TEXT_REPRESENTATION:
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data format",
          code: error.code,
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );

    default:
      return NextResponse.json(
        {
          success: false,
          message: "Database operation failed",
          code: error.code,
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
  }
}

/**
 * Handle authentication errors
 */
export function handleAuthError(
  message: string = "Unauthorized",
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
      code: "AUTH_ERROR",
    },
    { status: HTTP_STATUS.UNAUTHORIZED },
  );
}

/**
 * Handle authorization errors
 */
export function handleAuthorizationError(
  message: string = "Access denied",
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
      code: "AUTHORIZATION_ERROR",
    },
    { status: HTTP_STATUS.FORBIDDEN },
  );
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  errors: Array<{ field: string; message: string }>,
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details: errors,
    },
    { status: HTTP_STATUS.BAD_REQUEST },
  );
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(
  resource: string = "Resource",
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      message: `${resource} not found`,
      code: "NOT_FOUND",
    },
    { status: HTTP_STATUS.NOT_FOUND },
  );
}

/**
 * Handle generic server errors
 */
export function handleServerError(
  message: string = "An unexpected error occurred",
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
      code: "SERVER_ERROR",
    },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
  );
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data?: T,
  message: string = "Operation successful",
  status: number = HTTP_STATUS.OK,
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status },
  );
}

/**
 * Handle vote-specific errors
 */
export function handleVoteError(error: {
  code?: string;
  message?: string;
}): NextResponse<ErrorResponse> {
  if (error.code === DB_ERROR_CODES.UNIQUE_VIOLATION) {
    return NextResponse.json(
      {
        success: false,
        message: "You have already voted on this poll",
        code: "DUPLICATE_VOTE",
      },
      { status: HTTP_STATUS.CONFLICT },
    );
  }

  return handleDatabaseError(error);
}

/**
 * Handle poll-specific errors
 */
export function handlePollError(error: {
  code?: string;
  message?: string;
}): NextResponse<ErrorResponse> {
  if (error.code === DB_ERROR_CODES.FOREIGN_KEY_VIOLATION) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid poll or option reference",
        code: "INVALID_REFERENCE",
      },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  return handleDatabaseError(error);
}

/**
 * Generic error handler for API routes
 */
export function handleApiError(
  error: { code?: string; message?: string },
  context: string = "API",
): NextResponse<ErrorResponse> {
  console.error(`${context} error:`, error);

  // Handle known error types
  if (error.code && Object.values(DB_ERROR_CODES).includes(error.code)) {
    return handleDatabaseError(error);
  }

  // Handle validation errors
  if (error.name === "ZodError") {
    return handleValidationError(error.issues);
  }

  // Handle authentication errors
  if (error.message?.includes("auth") || error.message?.includes("token")) {
    return handleAuthError(error.message);
  }

  // Default server error
  return handleServerError(error.message || "An unexpected error occurred");
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>,
) {
  return async (...args: T): Promise<NextResponse<R | ErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, "API Route");
    }
  };
}
