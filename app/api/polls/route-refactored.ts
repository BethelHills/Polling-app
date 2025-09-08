import { NextRequest } from "next/server";
import { validateAndSanitizePoll } from "@/lib/validation-schemas";
import { auditLog } from "@/lib/audit-logger";
import { ApiHelpers, PollDatabase } from "@/lib/api-helpers";

/**
 * Refactored POST endpoint for creating polls
 * Improved with better error handling, separation of concerns, and maintainability
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate request size
    const sizeValidation = ApiHelpers.validateRequestSize(request);
    if (sizeValidation) return sizeValidation;

    // 2. Parse and validate JSON
    const body = await request.json();
    const jsonValidation = ApiHelpers.validateJsonSize(body);
    if (jsonValidation) return jsonValidation;

    // 3. Validate and sanitize the request body
    const validationResult = validateAndSanitizePoll(body);
    if (!validationResult.success) {
      return ApiHelpers.errorResponse(
        "Validation failed",
        400,
        validationResult.errors
      );
    }

    // 4. Authenticate user
    const { user, error: authError } = await ApiHelpers.authenticateUser(request);
    if (authError || !user) return authError!;

    // 5. Extract validated data
    const { title, description, options } = validationResult.data!;

    // 6. Create poll with options
    const { poll, error: dbError } = await PollDatabase.createPollWithOptions(
      {
        title,
        description,
        ownerId: user.id,
      },
      options
    );

    if (dbError) return dbError;

    // 7. Log audit event (non-blocking)
    await ApiHelpers.safeAuditLog(
      () => auditLog.pollCreated(request, user.id, (poll as { id: string }).id, title),
      "poll creation"
    );

    // 8. Return success response
    return ApiHelpers.successResponse(
      "Poll created successfully!",
      {
        pollId: (poll as { id: string }).id,
        poll: {
          id: (poll as { id: string }).id,
          title: (poll as { title: string }).title,
          description: (poll as { description?: string }).description,
          options: (poll as { options: unknown[] }).options,
        },
      },
      201
    );

  } catch (error) {
    console.error("Error in poll creation API:", error);
    return ApiHelpers.errorResponse("An unexpected error occurred", 500);
  }
}

/**
 * Refactored GET endpoint for fetching polls
 * Improved with better error handling and cleaner code structure
 */
export async function GET() {
  try {
    const { polls, error } = await PollDatabase.fetchPollsWithVotes();
    
    if (error) return error;

    return ApiHelpers.successResponse("Polls fetched successfully", { polls });

  } catch (error) {
    console.error("Error in polls GET API:", error);
    return ApiHelpers.errorResponse("An unexpected error occurred", 500);
  }
}
