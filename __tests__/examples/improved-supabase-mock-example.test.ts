/**
 * Example test file demonstrating improved Supabase mocking
 * This shows how to use the centralized mock system
 */

import "@testing-library/jest-dom";
import { POST, GET } from "@/app/api/polls/route";
import { NextRequest } from "next/server";

// Mock the Supabase server client
jest.mock("@/lib/supabaseServerClient", () => ({
  supabaseServerClient: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe("Improved Supabase Mock Example", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;
  });

  describe("Authentication Tests", () => {
    it("should handle successful authentication", async () => {
      // Setup successful authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null
      });

      // Setup successful poll creation
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
        if (table === "poll_options") {
          return {
            insert: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          };
        }
        return {};
      });

      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-12345",
        },
        body: JSON.stringify({
          title: "Test Poll",
          options: ["Option 1", "Option 2"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it("should handle authentication failure", async () => {
      // Setup authentication failure
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token" }
      });

      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({
          title: "Test Poll",
          options: ["Option 1", "Option 2"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain("Unauthorized");
    });
  });

  describe("Database Tests", () => {
    it("should handle database errors", async () => {
      // Setup successful authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null
      });

      // Setup database error
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === "polls") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Database connection failed" }
                })
              })
            })
          };
        }
        return {};
      });

      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-12345",
        },
        body: JSON.stringify({
          title: "Test Poll",
          options: ["Option 1", "Option 2"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain("Failed to create poll");
    });

    it("should fetch polls successfully", async () => {
      // Setup successful polls fetch
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === "polls") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: "poll-1",
                      title: "Poll 1",
                      is_active: true,
                      created_at: "2024-01-01T00:00:00Z",
                      total_votes: 8,
                      options: [
                        { id: "option-1", votes: 5 },
                        { id: "option-2", votes: 3 }
                      ]
                    },
                    {
                      id: "poll-2",
                      title: "Poll 2",
                      is_active: true,
                      created_at: "2024-01-02T00:00:00Z",
                      total_votes: 5,
                      options: [
                        { id: "option-3", votes: 3 },
                        { id: "option-4", votes: 2 }
                      ]
                    }
                  ],
                  error: null
                })
              })
            })
          };
        }
        return {};
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.polls).toHaveLength(2);
      expect(data.polls[0].total_votes).toBe(8);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle poll creation with multiple database operations", async () => {
      // Setup successful authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null
      });

      // Setup poll creation and options creation
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === "polls") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "poll-123", title: "Complex Poll" },
                  error: null
                })
              })
            })
          };
        }
        if (table === "poll_options") {
          return {
            insert: jest.fn().mockResolvedValue({
              data: [
                { id: "opt-1", text: "Option 1", votes: 0 },
                { id: "opt-2", text: "Option 2", votes: 0 }
              ],
              error: null
            })
          };
        }
        return {};
      });

      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-12345",
        },
        body: JSON.stringify({
          title: "Complex Poll",
          description: "A poll with multiple options",
          options: ["Option 1", "Option 2", "Option 3"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.poll.title).toBe("Complex Poll");
    });
  });
});
