import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

// Constants for better maintainability
const REQUEST_SIZE_LIMIT = 10000; // 10KB
const MIN_TOKEN_LENGTH = 10;

// Types for better type safety
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

interface AuthenticatedUser {
  id: string;
  email?: string;
}

// Utility functions for better separation of concerns
export class ApiHelpers {
  /**
   * Validates request size and returns appropriate response if invalid
   */
  static validateRequestSize(request: NextRequest): NextResponse | null {
    const contentLength = request.headers.get("content-length");
    
    if (contentLength && parseInt(contentLength) > REQUEST_SIZE_LIMIT) {
      return this.errorResponse("Request too large", 413);
    }
    
    return null;
  }

  /**
   * Validates JSON payload size
   */
  static validateJsonSize(body: any): NextResponse | null {
    if (JSON.stringify(body).length > REQUEST_SIZE_LIMIT) {
      return this.errorResponse("Request payload too large", 413);
    }
    
    return null;
  }

  /**
   * Authenticates user from request headers
   */
  static async authenticateUser(request: NextRequest): Promise<{
    user: AuthenticatedUser | null;
    error: NextResponse | null;
  }> {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        user: null,
        error: this.errorResponse("Invalid authorization header format", 401)
      };
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token || token.length < MIN_TOKEN_LENGTH) {
      return {
        user: null,
        error: this.errorResponse("Invalid token format", 401)
      };
    }

    try {
      const { data: userData, error: userErr } = 
        await supabaseServerClient.auth.getUser(token);
        
      if (userErr || !userData?.user) {
        return {
          user: null,
          error: this.errorResponse("Unauthorized - Invalid token", 401)
        };
      }

      return {
        user: {
          id: userData.user.id,
          email: userData.user.email
        },
        error: null
      };
    } catch (error) {
      console.error("Authentication error:", error);
      return {
        user: null,
        error: this.errorResponse("Authentication failed", 401)
      };
    }
  }

  /**
   * Creates standardized error responses
   */
  static errorResponse(
    message: string, 
    status: number, 
    errors?: any
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      message,
      ...(errors && { errors })
    };
    
    return NextResponse.json(response, { status });
  }

  /**
   * Creates standardized success responses
   */
  static successResponse<T>(
    message: string, 
    data?: T, 
    status: number = 200
  ): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      message,
      ...(data && { data })
    };
    
    return NextResponse.json(response, { status });
  }

  /**
   * Handles database errors with proper logging
   */
  static handleDatabaseError(error: any, operation: string): NextResponse {
    console.error(`Database error during ${operation}:`, error);
    return this.errorResponse(`Failed to ${operation}`, 500);
  }

  /**
   * Safely executes audit logging without failing the main operation
   */
  static async safeAuditLog(
    auditFunction: () => Promise<void>,
    operation: string
  ): Promise<void> {
    try {
      await auditFunction();
    } catch (auditError) {
      console.error(`Failed to log audit event for ${operation}:`, auditError);
      // Don't throw - audit logging failure shouldn't break main operation
    }
  }
}

// Database operations helper
export class PollDatabase {
  /**
   * Creates a poll with options in a transaction-like manner
   */
  static async createPollWithOptions(
    pollData: {
      title: string;
      description?: string;
      ownerId: string;
    },
    options: string[]
  ): Promise<{
    poll: any;
    error: NextResponse | null;
  }> {
    try {
      // Create the poll
      const { data: poll, error: pollError } = await supabaseServerClient
        .from("polls")
        .insert({
          title: pollData.title,
          description: pollData.description || null,
          is_active: true,
          owner_id: pollData.ownerId,
        })
        .select()
        .single();

      if (pollError) {
        return { poll: null, error: ApiHelpers.handleDatabaseError(pollError, "create poll") };
      }

      // Create poll options
      const optionsData = options
        .filter((option) => option.trim())
        .map((option, index) => ({
          poll_id: poll.id,
          text: option.trim(),
          votes: 0,
          order: index,
        }));

      const { error: optionsError } = await supabaseServerClient
        .from("poll_options")
        .insert(optionsData);

      if (optionsError) {
        return { poll: null, error: ApiHelpers.handleDatabaseError(optionsError, "create poll options") };
      }

      return { 
        poll: {
          ...poll,
          options: optionsData
        }, 
        error: null 
      };
    } catch (error) {
      return { poll: null, error: ApiHelpers.handleDatabaseError(error, "create poll with options") };
    }
  }

  /**
   * Fetches polls with their options and vote counts
   */
  static async fetchPollsWithVotes(): Promise<{
    polls: any[];
    error: NextResponse | null;
  }> {
    try {
      const { data: polls, error } = await supabaseServerClient
        .from("polls")
        .select(`
          *,
          options: poll_options (
            id,
            votes
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        return { polls: [], error: ApiHelpers.handleDatabaseError(error, "fetch polls") };
      }

      // Calculate total votes for each poll
      const pollsWithVotes = polls.map((poll) => ({
        ...poll,
        total_votes: poll.options.reduce(
          (sum: number, option: any) => sum + option.votes,
          0,
        ),
      }));

      return { polls: pollsWithVotes, error: null };
    } catch (error) {
      return { polls: [], error: ApiHelpers.handleDatabaseError(error, "fetch polls with votes") };
    }
  }
}
