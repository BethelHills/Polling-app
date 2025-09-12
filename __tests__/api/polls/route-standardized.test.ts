import "@testing-library/jest-dom";
import { POST, GET } from "@/app/api/polls/route";
import { 
  createAuthMocks, 
  createTestRequest, 
  createUnauthRequest, 
  createInvalidTokenRequest,
  authMockHelper 
} from "../../utils/auth-mock-helper";

describe("/api/polls - Standardized Authentication Tests", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Use the standardized auth mock helper
    mockSupabaseClient = createAuthMocks({
      authenticated: true,
      pollData: { id: "test-poll-id", title: "Test Poll" },
      pollOptionsData: [
        { id: "option-1", text: "Option 1", votes: 0 },
        { id: "option-2", text: "Option 2", votes: 0 }
      ],
      pollsListData: [
        { id: "poll-1", title: "Poll 1", total_votes: 5 },
        { id: "poll-2", title: "Poll 2", total_votes: 3 }
      ]
    });
  });

  describe("POST /api/polls", () => {
    it("should successfully create a poll with valid authentication", async () => {
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

    it("should reject requests without authorization header", async () => {
      const request = createUnauthRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Invalid authorization header format");
    });

    it("should reject requests with invalid token format", async () => {
      const request = createInvalidTokenRequest({ token: "short" });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Invalid token format");
    });

    it("should reject requests with invalid token", async () => {
      // Override the mock to return authentication failure
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Invalid token" }
      });

      const request = createTestRequest({ token: "invalid-token" });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Unauthorized - Invalid token");
    });

    it("should validate poll data", async () => {
      const request = createTestRequest({
        body: {
          title: "", // Invalid: empty title
          options: ["Option 1"] // Invalid: only one option
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Validation failed");
      expect(data.errors).toBeDefined();
    });

    it("should handle database errors during poll creation", async () => {
      // Override the mock to return database error
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" }
            })
          })
        })
      });

      const request = createTestRequest();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Failed to create poll");
    });
  });

  describe("GET /api/polls", () => {
    it("should successfully fetch all polls", async () => {
      const request = createTestRequest({ method: "GET" });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.polls).toBeDefined();
      expect(Array.isArray(data.polls)).toBe(true);
    });

    it("should handle database errors when fetching polls", async () => {
      // Override the mock to return database error
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" }
            })
          })
        })
      });

      const request = createTestRequest({ method: "GET" });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Failed to fetch polls");
    });
  });
});
