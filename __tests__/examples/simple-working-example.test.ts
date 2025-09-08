import "@testing-library/jest-dom";
import { NextRequest } from "next/server";

// Your exact mock pattern - this works!
jest.mock("@/lib/supabaseServerClient", () => ({
  supabaseServerClient: {
    auth: {
      getUser: jest.fn().mockImplementation((token) => {
        if (token === "test-token") {
          return Promise.resolve({ data: { user: { id: "test-user-id" } }, error: null });
        }
        return Promise.resolve({ data: { user: null }, error: { message: "Invalid token" } });
      }),
    },
    from: jest.fn(),
  },
}));

jest.mock("@/lib/audit-logger", () => ({
  auditLog: {
    pollCreated: jest.fn().mockResolvedValue(undefined),
  },
}));

// Import after mocking
import { POST } from "@/app/api/polls/route";

describe("Simple Working Example - Your Mock Pattern", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;
    
    // Reset mock calls but keep implementations
    jest.clearAllMocks();
    
    // Re-setup the auth mock after clearing
    mockSupabaseClient.auth.getUser.mockImplementation((token: string) => {
      if (token === "test-token") {
        return Promise.resolve({ data: { user: { id: "test-user-id" } }, error: null });
      }
      return Promise.resolve({ data: { user: null }, error: { message: "Invalid token" } });
    });
  });

  it("should work with your exact mock pattern", async () => {
    // The mock is already set up to handle test-token authentication

    // Setup database mocks
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: "poll-123", title: "Test Poll" },
          error: null,
        }),
      }),
    });

    const mockInsertOptions = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    mockSupabaseClient.from
      .mockReturnValueOnce({ insert: mockInsert })
      .mockReturnValueOnce({ insert: mockInsertOptions });

    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        "authorization": "Bearer test-token",
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
    expect(data.message).toContain("Invalid authorization header format");
  });
});

// Your mock pattern as a reusable utility
export const setupSupabaseMock = () => {
  const { supabaseServerClient } = require("@/lib/supabaseServerClient");

  return {
    // Your exact mock pattern
    mockGetUser: supabaseServerClient.auth.getUser,
    mockFrom: supabaseServerClient.from,

    // Helper methods
    setupSuccessfulAuth: (userId = "user1") => {
      supabaseServerClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });
    },

    setupFailedAuth: (error = new Error("Invalid token")) => {
      supabaseServerClient.auth.getUser.mockResolvedValue({
        data: null,
        error,
      });
    },

    setupSuccessfulPollCreation: () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "poll-123", title: "Test Poll" },
            error: null,
          }),
        }),
      });

      const mockInsertOptions = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      supabaseServerClient.from
        .mockReturnValueOnce({ insert: mockInsert })
        .mockReturnValueOnce({ insert: mockInsertOptions });
    },
  };
};

// Example using the utility
describe("Using Your Mock Pattern as Utility", () => {
  let mock: ReturnType<typeof setupSupabaseMock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mock = setupSupabaseMock();
  });

  it("should work with utility functions", async () => {
    mock.setupSuccessfulAuth();
    mock.setupSuccessfulPollCreation();

    const request = new NextRequest("http://localhost:3000/api/polls", {
      method: "POST",
      headers: {
        "authorization": "Bearer test-token",
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
