import "@testing-library/jest-dom";
import { POST, GET } from "@/app/api/polls/route";
import { createMockRequest } from "../../utils/test-utils";

// Mock the Supabase server client
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

describe("Poll Creation API - Custom Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ✅ Unit Test 1: Happy path
  it("should create a new poll when valid data is provided", async () => {
    const { supabaseAdmin } = require("@/lib/supabase");
    const mockRequest = createMockRequest({
      title: "My Poll",
      description: "A test poll",
      options: ["Yes", "No"],
    });

    // Mock successful database operations
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    const mockFrom = supabaseServerClient.from as jest.Mock;
    const mockSingle = jest.fn();

    mockFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn(),
        }),
      }),
    });
    mockSingle
      .mockResolvedValueOnce({
        data: {
          id: "poll-123",
          title: "My Poll",
          description: "A test poll",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: null,
      });

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);
    expect(responseData.poll.title).toBe("My Poll");
    expect(responseData.pollId).toBe("poll-123");
  });

  // ✅ Unit Test 2: Failure case
  it("should return error when no title is provided", async () => {
    const mockRequest = createMockRequest({
      title: "",
      description: "",
      options: [],
    });

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.message).toBe("Validation failed");
    expect(responseData.errors).toBeDefined();
    expect(responseData.errors.length).toBeGreaterThan(0);
  });

  // ✅ Integration Test: With mocked Supabase
  it("should call Supabase insert with correct payload", async () => {
    const { supabaseAdmin } = require("@/lib/supabase");
    const mockRequest = createMockRequest({
      title: "Integration Poll",
      description: "Testing integration",
      options: ["A", "B"],
    });

    const insertMock = jest.fn();
    const selectMock = jest.fn();
    const singleMock = jest.fn();
    const fromMock = jest.fn((table) => {
      if (table === "polls") {
        return {
          insert: insertMock.mockReturnValue({
            select: selectMock.mockReturnValue({
              single: singleMock.mockResolvedValue({
                data: {
                  id: "integration-poll-456",
                  title: "Integration Poll",
                  description: "Testing integration",
                  is_active: true,
                  created_at: "2024-01-01T00:00:00Z",
                },
                error: null,
              }),
            }),
          }),
        };
      } else if (table === "poll_options") {
        return {
          insert: insertMock.mockReturnValue({
            data: null,
            error: null,
          }),
        };
      }
      return { insert: insertMock, select: selectMock };
    });

    supabaseAdmin.from = fromMock;

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData.success).toBe(true);

    // Verify the correct payload was sent to Supabase
    expect(insertMock).toHaveBeenCalledWith({
      title: "Integration Poll",
      description: "Testing integration",
      is_active: true,
    });

    expect(insertMock).toHaveBeenCalledWith([
      { poll_id: "integration-poll-456", text: "A", votes: 0, order: 0 },
      { poll_id: "integration-poll-456", text: "B", votes: 0, order: 1 },
    ]);
  });

  // Additional test: Empty title validation
  it("should return an error message when no title is provided", async () => {
    const mockRequest = createMockRequest({
      title: "",
      description: "",
      options: [],
    });

    const response = await POST(mockRequest);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.message).toBe("Validation failed");

    // Check for specific validation error
    const titleError = responseData.errors.find(
      (err: any) => err.field === "title",
    );
    expect(titleError).toBeDefined();
    expect(titleError.message).toContain("at least 3 characters");
  });

  // Additional test: GET endpoint
  it("should fetch all polls successfully", async () => {
    const { supabaseAdmin } = require("@/lib/supabase");

    const mockSelect = jest.fn();
    const mockEq = jest.fn();
    const mockOrder = jest.fn();
    const mockFrom = jest.fn(() => ({
      select: mockSelect,
    }));

    supabaseAdmin.from = mockFrom;

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      order: mockOrder,
    });
    mockOrder.mockResolvedValue({
      data: [
        {
          id: "poll-1",
          title: "Test Poll 1",
          description: "Test Description 1",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          options: [
            { id: "opt-1", votes: 5 },
            { id: "opt-2", votes: 3 },
          ],
        },
      ],
      error: null,
    });

    const response = await GET();
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.polls).toHaveLength(1);
    expect(responseData.polls[0].title).toBe("Test Poll 1");
    expect(responseData.polls[0].total_votes).toBe(8);
  });
});
