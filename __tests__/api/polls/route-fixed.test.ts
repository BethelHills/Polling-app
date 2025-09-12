import "@testing-library/jest-dom";
import { POST, GET } from "@/app/api/polls/route";
import { NextRequest } from "next/server";
import { 
  createAuthMocks, 
  createTestRequest, 
  createUnauthRequest, 
  createInvalidTokenRequest 
} from "../../utils/auth-mock-helper";

// Mock audit logger
jest.mock("@/lib/audit-logger", () => ({
  auditLog: {
    pollCreated: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("/api/polls POST endpoint - Fixed Tests", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Use standardized auth mock helper
    mockSupabaseClient = createAuthMocks({
      authenticated: true,
      pollData: { id: "test-poll-id", title: "Test Poll" },
      pollOptionsData: [],
      pollsListData: []
    });
  });

  it("should successfully create a poll with valid data", async () => {
    const request = createTestRequest({
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

  it("should reject malformed authorization headers", async () => {
    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        Authorization: "InvalidFormat token123",
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
    expect(data.message).toContain("Invalid authorization header format");
  });

  it("should reject requests without Bearer prefix", async () => {
    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        Authorization: "token123",
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
    expect(data.message).toContain("Invalid authorization header format");
  });

  it("should reject short tokens", async () => {
    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        Authorization: "Bearer 123",
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
    expect(data.message).toContain("Invalid token format");
  });

  it("should sanitize HTML in poll titles", async () => {
    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token-12345",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: '<script>alert("xss")</script>Test Poll',
        options: ["Option 1", "Option 2"],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.poll.title).toBe("Test Poll"); // HTML should be stripped
  });

  it("should reject oversized requests", async () => {
    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token-12345",
        "Content-Type": "application/json",
        "Content-Length": "15000",
      },
      body: JSON.stringify({
        title: "Test Poll",
        options: ["Option 1", "Option 2"],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(413);
    expect(data.success).toBe(false);
    expect(data.message).toContain("Request too large");
  });

  it("should handle authentication failure", async () => {
    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        Authorization: "Bearer 123", // Short token that will fail format validation
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
    expect(data.message).toContain("Invalid token format");
  });

  it("should validate poll data", async () => {
    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token-12345",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "AB", // Too short
        options: ["Option 1", "Option 2"],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errors).toContainEqual(
      expect.objectContaining({
        field: "title",
        message: expect.stringContaining("at least 3 characters"),
      }),
    );
  });
});

describe("/api/polls GET endpoint - Fixed Tests", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;
  });

  it("should successfully fetch all polls", async () => {
    // Mock successful poll fetch
    const mockPollsWithOptions = [
      {
        id: "poll-1",
        title: "Test Poll 1",
        options: [
          { id: "opt-1", votes: 5 },
          { id: "opt-2", votes: 3 },
        ],
      },
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockPollsWithOptions,
            error: null,
          }),
        }),
      }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.polls).toHaveLength(1);
    expect(data.polls[0].total_votes).toBe(8); // 5 + 3
  });

  it("should handle database errors when fetching polls", async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error("Database error"),
          }),
        }),
      }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toContain("Failed to fetch polls");
  });
});
