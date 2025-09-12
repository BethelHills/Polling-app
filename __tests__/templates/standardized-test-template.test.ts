/**
 * Standardized Test Template
 * This template shows the recommended patterns for Supabase testing
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
} from "../utils/supabase-test-helpers";

describe("Standardized Test Template - API Routes", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Standard pattern: Reset and get fresh mock client
    mockSupabaseClient = resetAndGetMockClient();
  });

  describe("POST /api/polls - Success Scenarios", () => {
    it("should create poll successfully with helper functions", async () => {
      // Standard pattern: Use scenario helpers for common cases
      setupSuccessfulPollCreationScenario(mockSupabaseClient);

      // Standard pattern: Use request helpers
      const request = createAuthenticatedRequest({
        body: {
          title: "Test Poll",
          options: ["Option 1", "Option 2"],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it("should create poll with custom data", async () => {
      // Standard pattern: Use scenario helpers with custom data
      setupSuccessfulPollCreationScenario(mockSupabaseClient, {
        id: "custom-poll-id",
        title: "Custom Poll",
        description: "A custom test poll",
      });

      const request = createAuthenticatedRequest({
        body: {
          title: "Custom Poll",
          description: "A custom test poll",
          options: ["Yes", "No", "Maybe"],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.poll.title).toBe("Custom Poll");
    });
  });

  describe("POST /api/polls - Error Scenarios", () => {
    it("should handle authentication failure", async () => {
      // Standard pattern: Use scenario helpers for error cases
      setupFailedPollCreationScenario(mockSupabaseClient);

      const request = createInvalidTokenRequest({
        token: "invalid-token" // This will trigger "Unauthorized" message
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain("Unauthorized");
    });

    it("should handle missing authorization header", async () => {
      // Standard pattern: Use request helpers for different scenarios
      const request = createUnauthenticatedRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain("Invalid authorization header format");
    });

    it("should handle database errors", async () => {
      // Standard pattern: Use scenario helpers for specific error types
      setupPollCreationWithDatabaseError(mockSupabaseClient, {
        message: "Database connection failed",
      });

      const request = createAuthenticatedRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain("Failed to create poll");
    });
  });

  describe("GET /api/polls - Success Scenarios", () => {
    it("should fetch polls successfully", async () => {
      // Standard pattern: Use scenario helpers for GET operations
      setupSuccessfulPollsFetchScenario(mockSupabaseClient);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.polls).toHaveLength(2);
      expect(data.polls[0].total_votes).toBe(8);
    });

    it("should fetch polls with custom data", async () => {
      // Standard pattern: Use scenario helpers with custom data
      const customPolls = [
        {
          id: "poll-1",
          title: "Custom Poll 1",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          total_votes: 10,
          options: [
            { id: "option-1", votes: 6 },
            { id: "option-2", votes: 4 },
          ],
        },
      ];

      setupSuccessfulPollsFetchScenario(mockSupabaseClient, customPolls);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.polls).toHaveLength(1);
      expect(data.polls[0].title).toBe("Custom Poll 1");
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete poll creation flow", async () => {
      // Standard pattern: Use scenario helpers for integration tests
      setupSuccessfulPollCreationScenario(mockSupabaseClient, {
        id: "integration-poll-id",
        title: "Integration Test Poll",
        description: "A poll for integration testing",
      });

      const request = createAuthenticatedRequest({
        body: {
          title: "Integration Test Poll",
          description: "A poll for integration testing",
          options: ["Yes", "No", "Maybe"],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.poll.title).toBe("Integration Test Poll");
    });
  });

  describe("Edge Cases", () => {
    it("should handle validation errors", async () => {
      // Standard pattern: Test validation without mocking database
      const request = createAuthenticatedRequest({
        body: {
          title: "AB", // Too short
          options: ["Option 1", "Option 2"],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toContainEqual(
        expect.objectContaining({
          field: "title",
          message: expect.stringContaining("at least 3 characters"),
        })
      );
    });

    it("should handle duplicate options", async () => {
      // Standard pattern: Test validation without mocking database
      const request = createAuthenticatedRequest({
        body: {
          title: "Test Poll",
          options: ["Option 1", "Option 1"], // Duplicate
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toContainEqual(
        expect.objectContaining({
          field: "options",
          message: expect.stringContaining("must be unique"),
        })
      );
    });
  });
});
