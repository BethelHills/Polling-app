/**
 * Migrated Test File - Demonstrates Improved Supabase Mocking
 * This file shows how to migrate from the old auth-mock-helper to the new standardized helpers
 */

import "@testing-library/jest-dom";
import { POST, GET } from "@/app/api/polls/route";
import { NextRequest } from "next/server";
import {
  resetAndGetMockClient,
  setupSuccessfulPollCreationScenario,
  setupFailedPollCreationScenario,
  setupPollCreationWithDatabaseError,
  setupSuccessfulPollsFetchScenario,
  createAuthenticatedRequest,
  createUnauthenticatedRequest,
  createInvalidTokenRequest,
} from "../../utils/supabase-test-helpers";

// Mock audit logger
jest.mock("@/lib/audit-logger", () => ({
  auditLog: {
    pollCreated: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("/api/polls POST endpoint - Migrated Tests", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // NEW PATTERN: Use standardized reset and get client
    mockSupabaseClient = resetAndGetMockClient();
  });

  describe("Success Scenarios", () => {
    it("should successfully create a poll with valid data", async () => {
      // NEW PATTERN: Use scenario helper instead of manual setup
      setupSuccessfulPollCreationScenario(mockSupabaseClient);

      // NEW PATTERN: Use standardized request helper
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
      expect(data.message).toBe("Poll created successfully!");
      expect(data.pollId).toBe("test-poll-id");
    });

    it("should create poll with custom data", async () => {
      // NEW PATTERN: Use scenario helper with custom data
      setupSuccessfulPollCreationScenario(mockSupabaseClient, {
        id: "custom-poll-id",
        title: "Custom Test Poll",
        description: "A custom test poll",
      });

      const request = createAuthenticatedRequest({
        body: {
          title: "Custom Test Poll",
          description: "A custom test poll",
          options: ["Yes", "No", "Maybe"]
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.poll.title).toBe("Custom Test Poll");
    });
  });

  describe("Authentication Error Scenarios", () => {
    it("should reject malformed authorization headers", async () => {
      // NEW PATTERN: Use scenario helper for auth failure
      setupFailedPollCreationScenario(mockSupabaseClient);

      const request = createInvalidTokenRequest({
        token: "malformed-token"
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain("Unauthorized");
    });

    it("should reject requests with invalid token", async () => {
      setupFailedPollCreationScenario(mockSupabaseClient);

      const request = createInvalidTokenRequest({
        token: "invalid-token"
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain("Unauthorized");
    });

    it("should reject requests without authorization header", async () => {
      // NEW PATTERN: Use unauthenticated request helper
      const request = createUnauthenticatedRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain("Invalid authorization header format");
    });
  });

  describe("Database Error Scenarios", () => {
    it("should handle database errors during poll creation", async () => {
      // NEW PATTERN: Use scenario helper for database errors
      setupPollCreationWithDatabaseError(mockSupabaseClient, {
        message: "Database connection failed"
      });

      const request = createAuthenticatedRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain("Failed to create poll");
    });

    it("should handle database errors during options creation", async () => {
      // NEW PATTERN: Use specific error scenario helper
      setupSuccessfulPollCreationScenario(mockSupabaseClient);
      
      // Override for options error
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
        if (table === "poll_options") {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Options error" }
            })
          };
        }
        return {};
      });

      const request = createAuthenticatedRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain("Poll created but options failed");
    });
  });

  describe("Validation Error Scenarios", () => {
    it("should return validation errors for invalid data", async () => {
      // NEW PATTERN: Test validation without mocking database
      const request = createAuthenticatedRequest({
        body: {
          title: "AB", // Too short
          options: ["Option 1", "Option 2"]
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toContainEqual(
        expect.objectContaining({
          field: "title",
          message: expect.stringContaining("at least 3 characters")
        })
      );
    });

    it("should return error for duplicate options", async () => {
      const request = createAuthenticatedRequest({
        body: {
          title: "Test Poll",
          options: ["Option 1", "Option 1"] // Duplicate
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toContainEqual(
        expect.objectContaining({
          field: "options",
          message: expect.stringContaining("must be unique")
        })
      );
    });
  });
});

describe("/api/polls GET endpoint - Migrated Tests", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // NEW PATTERN: Use standardized reset and get client
    mockSupabaseClient = resetAndGetMockClient();
  });

  it("should successfully fetch all polls", async () => {
    // NEW PATTERN: Use scenario helper for GET operations
    setupSuccessfulPollsFetchScenario(mockSupabaseClient);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.polls).toHaveLength(2);
    expect(data.polls[0].total_votes).toBe(8);
  });

  it("should fetch polls with custom data", async () => {
    // NEW PATTERN: Use scenario helper with custom data
    const customPolls = [
      {
        id: "poll-1",
        title: "Custom Poll 1",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        total_votes: 15,
        options: [
          { id: "option-1", votes: 10 },
          { id: "option-2", votes: 5 }
        ]
      }
    ];

    setupSuccessfulPollsFetchScenario(mockSupabaseClient, customPolls);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.polls).toHaveLength(1);
    expect(data.polls[0].title).toBe("Custom Poll 1");
    expect(data.polls[0].total_votes).toBe(15);
  });

  it("should handle database errors when fetching polls", async () => {
    // NEW PATTERN: Use specific error scenario
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "polls") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" }
              })
            })
          })
        };
      }
      return {};
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toContain("Failed to fetch polls");
  });
});
