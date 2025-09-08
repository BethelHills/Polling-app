import "@testing-library/jest-dom";
import { POST } from "@/app/api/polls/route";
import { NextRequest } from "next/server";

// Mock the Supabase server client - Your pattern works!
jest.mock("@/lib/supabaseServerClient", () => ({
  supabaseServerClient: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Get the mocked functions after the mock is set up
const { supabaseServerClient } = require("@/lib/supabaseServerClient");
const mockGetUser = supabaseServerClient.auth.getUser;
const mockFrom = supabaseServerClient.from;

// Mock audit logger
jest.mock("@/lib/audit-logger", () => ({
  auditLog: {
    pollCreated: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("Working Mock Example - Your Pattern", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should authenticate user successfully", async () => {
    // Setup successful authentication - Your mock pattern works!
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user1" } },
      error: null,
    });

    // Setup successful poll creation
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

    mockFrom
      .mockReturnValueOnce({ insert: mockInsert }) // For poll creation
      .mockReturnValueOnce({ insert: mockInsertOptions }); // For options creation

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
    expect(mockGetUser).toHaveBeenCalledWith("test-token");
  });

  it("should handle authentication failure", async () => {
    // Setup authentication failure
    mockGetUser.mockResolvedValue({
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
    expect(data.message).toContain("No token provided");
  });

  it("should validate input data", async () => {
    // Setup successful authentication
    mockGetUser.mockResolvedValue({
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

// Your exact mock pattern in a reusable format
export const createSupabaseMock = () => {
  const mockGetUser = jest.fn();
  const mockFrom = jest.fn();

  jest.mock("@/lib/supabaseServerClient", () => ({
    supabaseServerClient: {
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    },
  }));

  return {
    mockGetUser,
    mockFrom,
    setupSuccessfulAuth: () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user1" } },
        error: null,
      });
    },
    setupFailedAuth: (error = new Error("Invalid token")) => {
      mockGetUser.mockResolvedValue({
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

      mockFrom
        .mockReturnValueOnce({ insert: mockInsert })
        .mockReturnValueOnce({ insert: mockInsertOptions });
    },
  };
};

// Example using the reusable mock
describe("Reusable Mock Example", () => {
  let mock: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mock = createSupabaseMock();
  });

  it("should work with reusable mock", async () => {
    mock.setupSuccessfulAuth();
    mock.setupSuccessfulPollCreation();

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
