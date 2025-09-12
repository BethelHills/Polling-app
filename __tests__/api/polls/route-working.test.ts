import "@testing-library/jest-dom";
import { POST, GET } from "@/app/api/polls/route";

// Mock the Supabase server client with a working pattern
jest.mock("@/lib/supabaseServerClient", () => ({
  supabaseServerClient: {
    auth: {
      getUser: jest.fn().mockImplementation((token: string) => {
        // Accept tokens that are at least 10 characters long
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
      })
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "polls") {
        // Handle both POST (insert) and GET (select) operations
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "test-poll-id", title: "Test Poll" },
                error: null
              })
            })
          }),
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  { 
                    id: "poll-1", 
                    title: "Poll 1", 
                    is_active: true,
                    created_at: "2024-01-01T00:00:00Z",
                    options: [
                      { id: "option-1", votes: 3 },
                      { id: "option-2", votes: 2 }
                    ]
                  },
                  { 
                    id: "poll-2", 
                    title: "Poll 2", 
                    is_active: true,
                    created_at: "2024-01-02T00:00:00Z",
                    options: [
                      { id: "option-3", votes: 2 },
                      { id: "option-4", votes: 1 }
                    ]
                  }
                ],
                error: null
              })
            })
          })
        };
      }
      
      if (table === "poll_options") {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              then: jest.fn().mockResolvedValue({
                data: [
                  { id: "option-1", text: "Option 1", votes: 0 },
                  { id: "option-2", text: "Option 2", votes: 0 }
                ],
                error: null
              })
            })
          })
        };
      }

      // Default for other tables
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      };
    })
  }
}));

// Mock audit logger
jest.mock("@/lib/audit-logger", () => ({
  auditLog: {
    pollCreated: jest.fn().mockResolvedValue(undefined),
    pollVoted: jest.fn().mockResolvedValue(undefined),
    pollViewed: jest.fn().mockResolvedValue(undefined),
    userAuthenticated: jest.fn().mockResolvedValue(undefined),
    userUnauthorized: jest.fn().mockResolvedValue(undefined),
    vote: jest.fn().mockResolvedValue(undefined),
    pollCreation: jest.fn().mockResolvedValue(undefined),
    pollUpdate: jest.fn().mockResolvedValue(undefined),
    pollDeletion: jest.fn().mockResolvedValue(undefined),
    rateLimitExceeded: jest.fn().mockResolvedValue(undefined),
    suspiciousActivity: jest.fn().mockResolvedValue(undefined),
    securityViolation: jest.fn().mockResolvedValue(undefined),
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    userLogin: jest.fn().mockResolvedValue(undefined),
    userLogout: jest.fn().mockResolvedValue(undefined),
    adminAction: jest.fn().mockResolvedValue(undefined),
  }
}));

describe("/api/polls - Working Authentication Tests", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;
  });

  describe("POST /api/polls", () => {
    it("should successfully create a poll with valid authentication", async () => {
      const headers = new Headers();
      headers.set("authorization", "Bearer valid-token-12345");
      headers.set("content-type", "application/json");
      
      const request = {
        method: "POST",
        headers,
        url: "http://localhost:3000/api/polls",
        json: jest.fn().mockResolvedValue({
          title: "Test Poll",
          options: ["Option 1", "Option 2"]
        })
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Poll created successfully!");
      expect(data.pollId).toBe("test-poll-id");
    });

    it("should reject requests without authorization header", async () => {
      const headers = new Headers();
      headers.set("content-type", "application/json");
      
      const request = {
        method: "POST",
        headers,
        url: "http://localhost:3000/api/polls",
        json: jest.fn().mockResolvedValue({
          title: "Test Poll",
          options: ["Option 1", "Option 2"]
        })
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Invalid authorization header format");
    });

    it("should reject requests with invalid token format", async () => {
      const headers = new Headers();
      headers.set("authorization", "Bearer short");
      headers.set("content-type", "application/json");
      
      const request = {
        method: "POST",
        headers,
        url: "http://localhost:3000/api/polls",
        json: jest.fn().mockResolvedValue({
          title: "Test Poll",
          options: ["Option 1", "Option 2"]
        })
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Invalid token format");
    });

    it("should reject requests with invalid token", async () => {
      // Override the mock to return authentication failure
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Invalid token" }
      });

      const headers = new Headers();
      headers.set("authorization", "Bearer invalid-token");
      headers.set("content-type", "application/json");
      
      const request = {
        method: "POST",
        headers,
        url: "http://localhost:3000/api/polls",
        json: jest.fn().mockResolvedValue({
          title: "Test Poll",
          options: ["Option 1", "Option 2"]
        })
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Unauthorized - Invalid token");
    });

    it("should validate poll data", async () => {
      const headers = new Headers();
      headers.set("authorization", "Bearer valid-token-12345");
      headers.set("content-type", "application/json");
      
      const request = {
        method: "POST",
        headers,
        url: "http://localhost:3000/api/polls",
        json: jest.fn().mockResolvedValue({
          title: "", // Invalid: empty title
          options: ["Option 1"] // Invalid: only one option
        })
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Validation failed");
      expect(data.errors).toBeDefined();
    });

    it("should handle database errors during poll creation", async () => {
      // Override the mock to return database error
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" }
            })
          })
        })
      });

      const headers = new Headers();
      headers.set("authorization", "Bearer valid-token-12345");
      headers.set("content-type", "application/json");
      
      const request = {
        method: "POST",
        headers,
        url: "http://localhost:3000/api/polls",
        json: jest.fn().mockResolvedValue({
          title: "Test Poll",
          options: ["Option 1", "Option 2"]
        })
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Failed to create poll");
    });
  });

  describe("GET /api/polls", () => {
    it("should successfully fetch all polls", async () => {
      const headers = new Headers();
      headers.set("authorization", "Bearer valid-token-12345");
      
      const request = {
        method: "GET",
        headers,
        url: "http://localhost:3000/api/polls"
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.polls).toBeDefined();
      expect(Array.isArray(data.polls)).toBe(true);
    });

    it("should handle database errors when fetching polls", async () => {
      // Override the mock to return database error
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" }
            })
          })
        })
      });

      const headers = new Headers();
      headers.set("authorization", "Bearer valid-token-12345");
      
      const request = {
        method: "GET",
        headers,
        url: "http://localhost:3000/api/polls"
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Failed to fetch polls");
    });
  });
});
