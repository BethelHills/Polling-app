import "@testing-library/jest-dom";
import { POST, GET } from "@/app/api/polls/route";
import {
  createMockRequest,
  mockPollData,
  mockDbResponses,
} from "../../utils/test-utils";

// Mock the Supabase client
jest.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
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
  },
}));

// Mock Next.js cache revalidation
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("/api/polls POST endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Unit Tests", () => {
    it("should successfully create a poll with valid data", async () => {
      // Arrange
      const { supabaseAdmin } = require("@/lib/supabase");
      const mockRequest = createMockRequest(mockPollData.valid);

      // Mock successful database operations
      const mockInsert = jest.fn();
      const mockSelect = jest.fn();
      const mockSingle = jest.fn();
      const mockFrom = jest.fn(() => ({
        insert: mockInsert,
        select: mockSelect,
      }));

      supabaseAdmin.from = mockFrom;

      // Mock poll creation success
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });
      mockSingle
        .mockResolvedValueOnce(mockDbResponses.successfulPollCreation) // First call for poll creation
        .mockResolvedValueOnce(mockDbResponses.successfulOptionsCreation); // Second call for options creation

      // Act
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("Poll created successfully!");
      expect(responseData.pollId).toBe("poll-123");
      expect(responseData.poll).toBeDefined();
      expect(responseData.poll.title).toBe(mockPollData.valid.title);
      expect(responseData.poll.options).toHaveLength(4);

      // Verify database calls
      expect(mockFrom).toHaveBeenCalledWith("polls");
      expect(mockFrom).toHaveBeenCalledWith("poll_options");
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it("should return validation errors for invalid data", async () => {
      // Arrange
      const mockRequest = createMockRequest(mockPollData.invalid);

      // Act
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("Validation failed");
      expect(responseData.errors).toBeDefined();
      expect(responseData.errors.length).toBeGreaterThan(0);

      // Check specific validation errors
      const titleError = responseData.errors.find(
        (err: any) => err.field === "title",
      );
      const optionsError = responseData.errors.find(
        (err: any) => err.field === "options",
      );

      expect(titleError).toBeDefined();
      expect(titleError.message).toContain("at least 3 characters");
      expect(optionsError).toBeDefined();
      expect(optionsError.message).toContain("At least 2 options are required");
    });

    it("should return error for duplicate options", async () => {
      // Arrange
      const mockRequest = createMockRequest(mockPollData.duplicateOptions);

      // Act
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("Validation failed");

      const optionsError = responseData.errors.find(
        (err: any) => err.field === "options",
      );
      expect(optionsError).toBeDefined();
      expect(optionsError.message).toBe("Options must be unique");
    });

    it("should handle database errors during poll creation", async () => {
      // Arrange
      const { supabaseAdmin } = require("@/lib/supabase");
      const mockRequest = createMockRequest(mockPollData.valid);

      const mockInsert = jest.fn();
      const mockSelect = jest.fn();
      const mockSingle = jest.fn();
      const mockFrom = jest.fn(() => ({
        insert: mockInsert,
        select: mockSelect,
      }));

      supabaseAdmin.from = mockFrom;

      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue(mockDbResponses.pollCreationError);

      // Act
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("Failed to create poll");
    });

    it("should handle database errors during options creation", async () => {
      // Arrange
      const { supabaseAdmin } = require("@/lib/supabase");
      const mockRequest = createMockRequest(mockPollData.valid);

      let callCount = 0;
      const mockInsert = jest.fn();
      const mockSelect = jest.fn();
      const mockSingle = jest.fn();
      const mockFrom = jest.fn((table) => {
        callCount++;
        if (table === "polls") {
          return {
            insert: mockInsert.mockReturnValue({
              select: mockSelect.mockReturnValue({
                single: mockSingle.mockResolvedValue(
                  mockDbResponses.successfulPollCreation,
                ),
              }),
            }),
          };
        } else if (table === "poll_options") {
          return {
            insert: mockInsert.mockReturnValue(
              mockDbResponses.optionsCreationError,
            ),
          };
        }
        return { insert: mockInsert, select: mockSelect };
      });

      supabaseAdmin.from = mockFrom;

      // Act
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("Poll created but options failed");
    });

    it("should handle unexpected errors gracefully", async () => {
      // Arrange
      const mockRequest = createMockRequest(mockPollData.valid);

      // Mock request.json() to throw an error
      mockRequest.json = jest
        .fn()
        .mockRejectedValue(new Error("Unexpected error"));

      // Act
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("An unexpected error occurred");
    });
  });

  describe("Integration Test", () => {
    it("should handle complete poll creation flow with real validation", async () => {
      // Arrange
      const { supabaseAdmin } = require("@/lib/supabase");
      const validPollData = {
        title: "What is your favorite framework?",
        description:
          "Choose the framework you prefer for building web applications",
        options: ["React", "Vue", "Angular", "Svelte"],
      };

      const mockRequest = createMockRequest(validPollData);

      const mockInsert = jest.fn();
      const mockSelect = jest.fn();
      const mockSingle = jest.fn();
      const mockFrom = jest.fn(() => ({
        insert: mockInsert,
        select: mockSelect,
      }));

      supabaseAdmin.from = mockFrom;

      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });
      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: "integration-test-poll-456",
            title: validPollData.title,
            description: validPollData.description,
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      // Act
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.pollId).toBe("integration-test-poll-456");
      expect(responseData.poll.title).toBe(validPollData.title);
      expect(responseData.poll.description).toBe(validPollData.description);
      expect(responseData.poll.options).toHaveLength(4);
      expect(responseData.poll.options[0].text).toBe("React");
      expect(responseData.poll.options[0].votes).toBe(0);
      expect(responseData.poll.options[0].order).toBe(0);

      // Verify the complete database interaction flow
      expect(mockFrom).toHaveBeenCalledWith("polls");
      expect(mockFrom).toHaveBeenCalledWith("poll_options");
      expect(mockInsert).toHaveBeenCalledWith({
        title: validPollData.title,
        description: validPollData.description,
        is_active: true,
      });
      expect(mockInsert).toHaveBeenCalledWith([
        {
          poll_id: "integration-test-poll-456",
          text: "React",
          votes: 0,
          order: 0,
        },
        {
          poll_id: "integration-test-poll-456",
          text: "Vue",
          votes: 0,
          order: 1,
        },
        {
          poll_id: "integration-test-poll-456",
          text: "Angular",
          votes: 0,
          order: 2,
        },
        {
          poll_id: "integration-test-poll-456",
          text: "Svelte",
          votes: 0,
          order: 3,
        },
      ]);
    });
  });
});

describe("/api/polls GET endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully fetch all polls", async () => {
    // Arrange
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
        {
          id: "poll-2",
          title: "Test Poll 2",
          description: "Test Description 2",
          is_active: true,
          created_at: "2024-01-02T00:00:00Z",
          options: [
            { id: "opt-3", votes: 2 },
            { id: "opt-4", votes: 8 },
          ],
        },
      ],
      error: null,
    });

    // Act
    const response = await GET();
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.polls).toHaveLength(2);
    expect(responseData.polls[0].total_votes).toBe(8); // 5 + 3
    expect(responseData.polls[1].total_votes).toBe(10); // 2 + 8
  });

  it("should handle database errors when fetching polls", async () => {
    // Arrange
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
      data: null,
      error: { message: "Database connection failed" },
    });

    // Act
    const response = await GET();
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(responseData.success).toBe(false);
    expect(responseData.message).toBe("Failed to fetch polls");
  });
});
