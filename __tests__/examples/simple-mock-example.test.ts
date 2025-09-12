import "@testing-library/jest-dom";
import { POST } from "@/app/api/polls/route";
import { NextRequest } from "next/server";

// Your exact mock pattern - working version
jest.mock("@/lib/supabaseServerClient", () => ({
  supabaseServerClient: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Mock audit logger
jest.mock("@/lib/audit-logger", () => ({
  auditLog: {
    pollCreated: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("Simple Mock Example - Your Pattern", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;

    // Setup database mocks
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "polls") {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "poll-123", title: "Test Poll" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "poll_options") {
        return {
          insert: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      }
      return {};
    });
  });

  it("should authenticate user successfully", async () => {
    // Setup successful authentication
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user1" } },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
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
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith("test-token");
  });

  it("should handle authentication failure", async () => {
    // Setup authentication failure
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: null,
      error: new Error("Invalid token"),
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
    expect(data.message).toContain("Unauthorized - Invalid token");
  });

  it("should handle missing authorization header", async () => {
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
    expect(data.message).toContain("Invalid authorization header format");
  });

  it("should validate input data", async () => {
    // Setup successful authentication
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user1" } },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
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

// Utility function to create test requests
export const createTestRequest = (options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}) => {
  const { method = "POST", headers = {}, body } = options;

  return new NextRequest("http://localhost:3000/api/polls", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
};

// Example using the utility
describe("Using Test Request Utility", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;

    // Setup database mocks
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === "polls") {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "poll-123", title: "Test Poll" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "poll_options") {
        return {
          insert: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      }
      return {};
    });
  });

  it("should work with utility function", async () => {
    // Setup authentication
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user1" } },
      error: null,
    });

    const request = createTestRequest({
      headers: {
        Authorization: "Bearer test-token",
      },
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
});
