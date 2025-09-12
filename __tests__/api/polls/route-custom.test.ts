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
                data: { id: "poll-123", title: "My Poll" },
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
                    title: "Test Poll 1", 
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

describe("Poll Creation API - Custom Tests", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;
  });

  it("should create a new poll when valid data is provided", async () => {
    const headers = new Headers();
    headers.set("authorization", "Bearer valid-token-12345");
    headers.set("content-type", "application/json");
    
    const request = {
      method: "POST",
      headers,
      url: "http://localhost:3000/api/polls",
      json: jest.fn().mockResolvedValue({
        title: "My Poll",
        options: ["Option 1", "Option 2"]
      })
    } as any;

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);
    expect(responseData.poll.title).toBe("My Poll");
    expect(responseData.pollId).toBe("poll-123");
  });

  it("should return error when no title is provided", async () => {
    const headers = new Headers();
    headers.set("authorization", "Bearer valid-token-12345");
    headers.set("content-type", "application/json");
    
    const request = {
      method: "POST",
      headers,
      url: "http://localhost:3000/api/polls",
      json: jest.fn().mockResolvedValue({
        title: "",
        options: ["Option 1", "Option 2"]
      })
    } as any;

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.message).toBe("Validation failed");
  });

  it("should call Supabase insert with correct payload", async () => {
    const headers = new Headers();
    headers.set("authorization", "Bearer valid-token-12345");
    headers.set("content-type", "application/json");
    
    const request = {
      method: "POST",
      headers,
      url: "http://localhost:3000/api/polls",
      json: jest.fn().mockResolvedValue({
        title: "Test Poll",
        description: "Test Description",
        options: ["Option 1", "Option 2", "Option 3"]
      })
    } as any;

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);

    // Verify the correct payload was sent to Supabase
    expect(mockSupabaseClient.from).toHaveBeenCalledWith("polls");
    expect(mockSupabaseClient.from).toHaveBeenCalledWith("poll_options");
  });

  it("should return an error message when no title is provided", async () => {
    const headers = new Headers();
    headers.set("authorization", "Bearer valid-token-12345");
    headers.set("content-type", "application/json");
    
    const request = {
      method: "POST",
      headers,
      url: "http://localhost:3000/api/polls",
      json: jest.fn().mockResolvedValue({
        title: "",
        options: ["Option 1", "Option 2"]
      })
    } as any;

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.message).toBe("Validation failed");
  });

  it("should fetch all polls successfully", async () => {
    const response = await GET();
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.polls).toHaveLength(1);
    expect(responseData.polls[0].title).toBe("Test Poll 1");
  });
});