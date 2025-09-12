import "@testing-library/jest-dom";
import { NextRequest } from "next/server";

// Mock must be set up BEFORE importing the module
jest.mock("@/lib/supabaseServerClient", () => ({
  supabaseServerClient: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock("@/lib/audit-logger", () => ({
  auditLog: {
    pollCreated: jest.fn().mockResolvedValue(undefined),
  },
}));

// Now import the module after mocking
import { POST } from "@/app/api/polls/route";

describe("Correct Mock Example - Your Pattern Works!", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    mockSupabaseClient = supabaseServerClient;
  });

  it("should authenticate user successfully", async () => {
    // Your mock pattern works perfectly!
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user1" } },
      error: null,
    });

    // Setup database mocks for poll creation
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

    // Mock the from() calls - first for poll, then for options
    mockSupabaseClient.from
      .mockReturnValueOnce({ insert: mockInsert }) // Poll creation
      .mockReturnValueOnce({ insert: mockInsertOptions }); // Options creation

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

// Your exact mock pattern as a reusable utility
export const createSupabaseMock = () => {
  const { supabaseServerClient } = require("@/lib/supabaseServerClient");

  return {
    // Your mock pattern works!
    mockAuth: {
      success: (userId = "user1") => {
        supabaseServerClient.auth.getUser.mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });
      },
      failure: (error = new Error("Invalid token")) => {
        supabaseServerClient.auth.getUser.mockResolvedValue({
          data: null,
          error,
        });
      },
    },

    mockDatabase: {
      success: () => {
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

      failure: (error = new Error("Database error")) => {
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
    },
  };
};

// Example using the utility
describe("Using Your Mock Pattern as Utility", () => {
  let mock: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mock = createSupabaseMock();
  });

  it("should work with utility functions", async () => {
    mock.mockAuth.success();
    mock.mockDatabase.success();

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
