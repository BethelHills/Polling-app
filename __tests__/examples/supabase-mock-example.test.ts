import "@testing-library/jest-dom";
import { POST } from "@/app/api/polls/route";
import { NextRequest } from "next/server";

// Your specific mock pattern - Fixed version
jest.mock("@/lib/supabaseServerClient", () => {
  const mockGetUser = jest.fn();
  const mockFrom = jest.fn();

  return {
    supabaseServerClient: {
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    },
  };
});

// Mock audit logger
jest.mock("@/lib/audit-logger", () => ({
  auditLog: {
    pollCreated: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("API Route with Your Mock Pattern", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;

    // Setup default successful responses
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user1" } },
      error: null,
    });

    // Setup database mocks
    const mockInsert = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockSelect = jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: { id: "poll-123", title: "Test Poll" },
        error: null,
      }),
    });

    mockSupabaseClient.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: mockSelect,
      }),
    });
  });

  it("should work with your mock setup", async () => {
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
});

// Enhanced version of your mock with more comprehensive setup
describe("Enhanced Mock Example", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Create a more comprehensive mock
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(),
          })),
        })),
      })),
    };

    // Mock the module with our enhanced client
    jest.doMock("@/lib/supabaseServerClient", () => ({
      supabaseServerClient: mockSupabaseClient,
    }));
  });

  it("should handle successful poll creation", async () => {
    // Setup successful authentication
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user1" } },
      error: null,
    });

    // Setup successful poll creation
    mockSupabaseClient
      .from()
      .insert()
      .select()
      .single.mockResolvedValue({
        data: { id: "poll-123", title: "Test Poll" },
        error: null,
      });

    // Setup successful options creation
    mockSupabaseClient.from().insert.mockResolvedValue({
      data: [],
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
    expect(data.message).toContain("Invalid authorization header format");
  });

  it("should handle database errors", async () => {
    // Setup successful authentication
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user1" } },
      error: null,
    });

    // Setup database error
    mockSupabaseClient
      .from()
      .insert()
      .select()
      .single.mockResolvedValue({
        data: null,
        error: new Error("Database connection failed"),
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

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toContain("Failed to create poll");
  });
});

// Utility function to create mock requests
export const createMockRequest = (options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
}) => {
  const {
    method = "POST",
    url = "http://localhost:3000/api/polls",
    headers = {},
    body,
  } = options;

  return new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
};

// Example usage of the utility
describe("Using Mock Request Utility", () => {
  it("should work with mock request utility", async () => {
    const request = createMockRequest({
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
