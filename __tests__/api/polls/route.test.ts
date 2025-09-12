import "@testing-library/jest-dom";
import { POST, GET } from "@/app/api/polls/route";

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
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;
    
    // Set up default successful behavior
    mockSupabaseClient.auth.getUser.mockImplementation((token: string) => {
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
    });
    
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
                    total_votes: 8,
                    options: [
                      { id: "option-1", votes: 5 },
                      { id: "option-2", votes: 3 }
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
                data: [],
                error: null
              })
            })
          })
        };
      }
      return {};
    });
  });

  describe("Unit Tests", () => {
    it("should successfully create a poll with valid data", async () => {
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
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("Poll created successfully!");
      expect(responseData.pollId).toBe("test-poll-id");
    });

    it("should return validation errors for invalid data", async () => {
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
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("Validation failed");
      expect(responseData.errors).toBeDefined();
    });

    it("should return error for duplicate options", async () => {
      const headers = new Headers();
      headers.set("authorization", "Bearer valid-token-12345");
      headers.set("content-type", "application/json");
      
      const request = {
        method: "POST",
        headers,
        url: "http://localhost:3000/api/polls",
        json: jest.fn().mockResolvedValue({
          title: "Test Poll",
          options: ["Option 1", "Option 1"] // Duplicate options
        })
      } as any;

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("Validation failed");
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
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("Failed to create poll");
    });

    it("should handle database errors during options creation", async () => {
      // Override the mock to return error for options
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
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("Poll created but options failed");
    });

    it("should handle unexpected errors gracefully", async () => {
      // Override the mock to throw an error
      mockSupabaseClient.from.mockImplementationOnce(() => {
        throw new Error("Unexpected error");
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
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("An unexpected error occurred");
    });
  });

  describe("Integration Test", () => {
    it("should handle complete poll creation flow with real validation", async () => {
      // Override the mock to return the correct title
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === "polls") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "test-poll-id", title: "Integration Test Poll" },
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
                  data: [],
                  error: null
                })
              })
            })
          };
        }
        return {};
      });

      const headers = new Headers();
      headers.set("authorization", "Bearer valid-token-12345");
      headers.set("content-type", "application/json");
      
      const request = {
        method: "POST",
        headers,
        url: "http://localhost:3000/api/polls",
        json: jest.fn().mockResolvedValue({
          title: "Integration Test Poll",
          description: "A poll for integration testing",
          options: ["Yes", "No", "Maybe"]
        })
      } as any;

      const response = await POST(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.pollId).toBe("test-poll-id");
      expect(responseData.poll.title).toBe("Integration Test Poll");
    });
  });
});

describe("/api/polls GET endpoint", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;
  });

  it("should successfully fetch all polls", async () => {
    // Ensure the mock is set up correctly for GET
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
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.polls).toHaveLength(2);
    expect(responseData.polls[0].total_votes).toBe(8); // 5 + 3
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

    const response = await GET();
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(responseData.success).toBe(false);
    expect(responseData.message).toBe("Failed to fetch polls");
  });
});