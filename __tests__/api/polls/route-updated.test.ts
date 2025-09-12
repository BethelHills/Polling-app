import "@testing-library/jest-dom";
import { POST, GET } from "@/app/api/polls/route";
import { NextRequest } from "next/server";

// Mock the Supabase server client with the working pattern
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

describe("/api/polls POST endpoint", () => {
  let mockServerClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockServerClient = supabaseServerClient;
  });

  describe("Authentication", () => {
    it("should reject requests without authorization header", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Poll",
          options: ["Option 1", "Option 2"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Invalid authorization header format");
    });

    it("should reject requests with invalid token", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid-token",
          "Content-Type": "application/json",
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
      expect(data.message).toBe("Unauthorized - Invalid token");
    });

    it("should accept requests with valid token", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-12345",
          "Content-Type": "application/json",
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
      expect(data.message).toContain("Poll created successfully");
    });
  });

  describe("Input Validation", () => {
    it("should validate poll title length", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-12345",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "A", // Too short
          options: ["Option 1", "Option 2"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Validation failed");
    });

    it("should validate poll title maximum length", async () => {
      const longTitle = "A".repeat(201); // Too long
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-12345",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: longTitle,
          options: ["Option 1", "Option 2"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Validation failed");
    });

    it("should validate minimum number of options", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-12345",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Poll",
          options: ["Option 1"], // Only one option
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Validation failed");
    });

    it("should validate maximum number of options", async () => {
      const manyOptions = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`);
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-12345",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Poll",
          options: manyOptions,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Validation failed");
    });

    it("should validate unique options", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-12345",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Poll",
          options: ["Option 1", "Option 1"], // Duplicate options
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Validation failed");
    });
  });

  describe("Database Operations", () => {
    it("should create poll successfully", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-12345",
          "Content-Type": "application/json",
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
      expect(data.pollId).toBeDefined();
      expect(data.poll.title).toBe("Test Poll");
    });

    it("should handle database errors during poll creation", async () => {
      // Override the mock to return database error
      mockServerClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" }
            })
          })
        })
      });

      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-12345",
          "Content-Type": "application/json",
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
      expect(data.message).toBe("Failed to create poll");
    });

    it("should handle database errors during options creation", async () => {
      // Override the mock to return error for options
      mockServerClient.from.mockImplementationOnce((table: string) => {
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
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                then: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Options error" }
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
          "Content-Type": "application/json",
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
      expect(data.message).toBe("Poll created but options failed");
    });
  });

  describe("Audit Logging", () => {
    it("should log poll creation for audit trail", async () => {
      const { auditLog } = require("@/lib/audit-logger");
      
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-12345",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Poll",
          options: ["Option 1", "Option 2"],
        }),
      });

      await POST(request);

      expect(auditLog.pollCreated).toHaveBeenCalledWith(
        expect.any(NextRequest),
        "test-user-id",
        expect.any(String),
        "Test Poll"
      );
    });
  });
});

describe("/api/polls GET endpoint", () => {
  let mockServerClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockServerClient = supabaseServerClient;
  });

  it("should fetch polls successfully", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.polls).toBeDefined();
    expect(Array.isArray(data.polls)).toBe(true);
  });

  it("should handle database errors when fetching polls", async () => {
    // Override the mock to return database error
    mockServerClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" }
          })
        })
      })
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Failed to fetch polls");
  });
});