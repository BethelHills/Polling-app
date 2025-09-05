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

describe("Final Working Mock Example", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;
  });

  it("should work with your exact mock pattern", async () => {
    // Your mock pattern works perfectly!
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user1" } },
      error: null,
    });

    // Setup database mocks
    mockSupabaseClient.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "poll-123", title: "Test Poll" },
            error: null,
          }),
        }),
      }),
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
    expect(data.message).toContain("Invalid token");
  });
});

// Your mock pattern as a reusable utility
export const setupSupabaseMock = () => {
  const { supabaseServerClient } = require("@/lib/supabaseServerClient");

  return {
    // Authentication helpers
    mockSuccessfulAuth: (userId = "user1") => {
      supabaseServerClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });
    },

    mockFailedAuth: (error = new Error("Invalid token")) => {
      supabaseServerClient.auth.getUser.mockResolvedValue({
        data: null,
        error,
      });
    },

    // Database helpers
    mockSuccessfulPollCreation: (pollId = "poll-123") => {
      supabaseServerClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: pollId, title: "Test Poll" },
              error: null,
            }),
          }),
        }),
      });
    },

    mockDatabaseError: (error = new Error("Database error")) => {
      supabaseServerClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      });
    },
  };
};

// Example using the utility
describe("Using Mock Utility", () => {
  let mock: ReturnType<typeof setupSupabaseMock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mock = setupSupabaseMock();
  });

  it("should work with utility functions", async () => {
    mock.mockSuccessfulAuth();
    mock.mockSuccessfulPollCreation();

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
  });
});
