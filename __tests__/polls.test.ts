import "@testing-library/jest-dom";
import { POST, GET } from "@/app/api/polls/route";
import { NextRequest } from "next/server";

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

// Helper function to create mock NextRequest
function createMockRequest(body: any): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
    method: "POST",
    headers: new Headers(),
    url: "http://localhost:3000/api/polls",
  } as any;
}

describe("Poll Creation API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Unit Tests", () => {
    // ✅ Unit Test 1: Happy Path
    it("should successfully create a poll with valid data", async () => {
      // Arrange
      const { supabaseAdmin } = require("@/lib/supabase");
      const validPollData = {
        title: "What is your favorite programming language?",
        description: "Choose your preferred language for web development",
        options: ["JavaScript", "TypeScript", "Python", "Go"],
      };

      const mockRequest = createMockRequest(validPollData);

      // Mock successful database operations
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
            id: "poll-123",
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
      expect(responseData.message).toBe("Poll created successfully!");
      expect(responseData.pollId).toBe("poll-123");
      expect(responseData.poll.title).toBe(validPollData.title);
      expect(responseData.poll.description).toBe(validPollData.description);
      expect(responseData.poll.options).toHaveLength(4);
      expect(responseData.poll.options[0].text).toBe("JavaScript");
      expect(responseData.poll.options[0].votes).toBe(0);
    });

    // ✅ Unit Test 2: Failure Case - Validation Error
    it("should return validation error when title is too short", async () => {
      // Arrange
      const invalidPollData = {
        title: "ab", // Too short (less than 3 characters)
        description: "A test poll",
        options: ["Yes", "No"],
      };

      const mockRequest = createMockRequest(invalidPollData);

      // Act
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("Validation failed");
      expect(responseData.errors).toBeDefined();
      expect(responseData.errors.length).toBeGreaterThan(0);

      // Check for specific validation error
      const titleError = responseData.errors.find(
        (err: any) => err.field === "title",
      );
      expect(titleError).toBeDefined();
      expect(titleError.message).toContain("at least 3 characters");
    });

    // ✅ Unit Test 3: Failure Case - Database Error
    it("should return error when Supabase poll creation fails", async () => {
      // Arrange
      const { supabaseAdmin } = require("@/lib/supabase");
      const validPollData = {
        title: "What is your favorite framework?",
        description: "Choose your preferred framework",
        options: ["React", "Vue", "Angular"],
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
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      });

      // Act
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("Failed to create poll");
    });

    // ✅ Unit Test 4: Failure Case - Options Creation Error
    it("should return error when poll options creation fails", async () => {
      // Arrange
      const { supabaseAdmin } = require("@/lib/supabase");
      const validPollData = {
        title: "What is your favorite color?",
        description: "Choose your preferred color",
        options: ["Red", "Blue", "Green"],
      };

      const mockRequest = createMockRequest(validPollData);

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
                single: mockSingle.mockResolvedValue({
                  data: {
                    id: "poll-456",
                    title: validPollData.title,
                    description: validPollData.description,
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
            insert: mockInsert.mockReturnValue({
              data: null,
              error: { message: "Failed to insert options" },
            }),
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
  });

  describe("Integration Test", () => {
    // ✅ Integration Test: Supabase Insert Called with Correct Payload
    it("should call Supabase insert with correct payload for poll and options", async () => {
      // Arrange
      const { supabaseAdmin } = require("@/lib/supabase");
      const testPollData = {
        title: "Integration Test Poll",
        description: "Testing complete integration flow",
        options: ["Option A", "Option B", "Option C"],
      };

      const mockRequest = createMockRequest(testPollData);

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
                    id: "integration-poll-789",
                    title: testPollData.title,
                    description: testPollData.description,
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

      // Act
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assert - Response is successful
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.pollId).toBe("integration-poll-789");

      // Assert - Supabase was called with correct poll payload
      expect(insertMock).toHaveBeenCalledWith({
        title: testPollData.title,
        description: testPollData.description,
        is_active: true,
      });

      // Assert - Supabase was called with correct options payload
      expect(insertMock).toHaveBeenCalledWith([
        {
          poll_id: "integration-poll-789",
          text: "Option A",
          votes: 0,
          order: 0,
        },
        {
          poll_id: "integration-poll-789",
          text: "Option B",
          votes: 0,
          order: 1,
        },
        {
          poll_id: "integration-poll-789",
          text: "Option C",
          votes: 0,
          order: 2,
        },
      ]);

      // Assert - Both database tables were accessed
      expect(fromMock).toHaveBeenCalledWith("polls");
      expect(fromMock).toHaveBeenCalledWith("poll_options");

      // Assert - Insert was called twice (once for polls, once for options)
      expect(insertMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("GET Endpoint Tests", () => {
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
      expect(responseData.polls[0].title).toBe("Test Poll 1");
      expect(responseData.polls[0].total_votes).toBe(8); // 5 + 3
      expect(responseData.polls[1].title).toBe("Test Poll 2");
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
});
