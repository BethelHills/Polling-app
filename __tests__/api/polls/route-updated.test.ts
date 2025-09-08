import "@testing-library/jest-dom";
import { POST, GET } from "@/app/api/polls/route";
import { NextRequest } from "next/server";
import {
  createApiTestMocks,
  cleanupMocks,
  mockUser,
  mockPoll,
  mockPollOptions,
} from "../../mocks/supabase-mocks";

// Mock the Supabase server client
jest.mock("@/lib/supabaseServerClient", () => ({
  supabaseServerClient: {
    auth: {
      getUser: jest.fn().mockImplementation((token) => {
        if (token === "test-token") {
          return Promise.resolve({ data: { user: mockUser }, error: null });
        }
        return Promise.resolve({ data: { user: null }, error: { message: "Invalid token" } });
      }),
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

describe("/api/polls POST endpoint", () => {
  let mockServerClient: any;

  beforeEach(() => {
    cleanupMocks();

    // Create fresh mocks for each test
    const mocks = createApiTestMocks({ authenticated: true });
    mockServerClient = mocks.mockServerClient;
  });

  describe("Authentication", () => {
    it("should reject requests without authorization header", async () => {
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

    it("should reject requests with invalid token", async () => {
      // Setup auth to return error
      mockServerClient.auth.getUser.mockResolvedValue({
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

    it("should accept requests with valid token", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
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
      expect(data.message).toContain("Poll created successfully");
    });
  });

  describe("Input Validation", () => {
    it("should validate poll title length", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
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

    it("should validate poll title maximum length", async () => {
      const longTitle = "A".repeat(201); // Too long

      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          title: longTitle,
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
          message: expect.stringContaining("less than 200 characters"),
        }),
      );
    });

    it("should validate minimum number of options", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          title: "Test Poll",
          options: ["Only one option"], // Too few
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toContainEqual(
        expect.objectContaining({
          field: "options",
          message: expect.stringContaining("At least 2 options are required"),
        }),
      );
    });

    it("should validate maximum number of options", async () => {
      const manyOptions = Array.from(
        { length: 11 },
        (_, i) => `Option ${i + 1}`,
      );

      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          title: "Test Poll",
          options: manyOptions, // Too many
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toContainEqual(
        expect.objectContaining({
          field: "options",
          message: expect.stringContaining("Maximum 10 options allowed"),
        }),
      );
    });

    it("should validate unique options", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          title: "Test Poll",
          options: ["Same Option", "Same Option"], // Duplicate
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toContainEqual(
        expect.objectContaining({
          field: "options",
          message: expect.stringContaining("Options must be unique"),
        }),
      );
    });
  });

  describe("Database Operations", () => {
    it("should create poll successfully", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          title: "Test Poll",
          description: "Test Description",
          options: ["Option 1", "Option 2"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.pollId).toBeDefined();
      expect(data.poll.title).toBe("Test Poll");
      expect(data.poll.description).toBe("Test Description");
      expect(data.poll.options).toHaveLength(2);
    });

    it("should handle database errors during poll creation", async () => {
      // Setup database to return error
      mockServerClient
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: null,
          error: new Error("Database error"),
        });

      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
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

    it("should handle database errors during options creation", async () => {
      // Setup poll creation to succeed but options to fail
      mockServerClient
        .from()
        .insert()
        .select()
        .single.mockResolvedValueOnce({ data: mockPoll, error: null }) // Poll creation succeeds
        .mockResolvedValueOnce({
          data: null,
          error: new Error("Options error"),
        }); // Options creation fails

      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
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
      expect(data.message).toContain("Poll created but options failed");
    });
  });

  describe("Audit Logging", () => {
    it("should log poll creation for audit trail", async () => {
      const { auditLog } = require("@/lib/audit-logger");

      const request = new NextRequest("http://localhost:3000/api/polls", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          title: "Test Poll",
          options: ["Option 1", "Option 2"],
        }),
      });

      await POST(request);

      expect(auditLog.pollCreated).toHaveBeenCalledWith(
        expect.any(NextRequest),
        mockUser.id,
        expect.any(String),
        "Test Poll",
      );
    });
  });
});

describe("/api/polls GET endpoint", () => {
  let mockServerClient: any;

  beforeEach(() => {
    cleanupMocks();

    const mocks = createApiTestMocks({ authenticated: false }); // GET doesn't require auth
    mockServerClient = mocks.mockServerClient;
  });

  it("should fetch polls successfully", async () => {
    // Setup mock response with polls and options
    const mockPollsWithOptions = [
      {
        ...mockPoll,
        options: mockPollOptions,
      },
    ];

    mockServerClient.from().select().eq().order.mockResolvedValue({
      data: mockPollsWithOptions,
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.polls).toHaveLength(1);
    expect(data.polls[0].total_votes).toBe(8); // 5 + 3 from mock options
  });

  it("should handle database errors when fetching polls", async () => {
    mockServerClient
      .from()
      .select()
      .eq()
      .order.mockResolvedValue({
        data: null,
        error: new Error("Database error"),
      });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toContain("Failed to fetch polls");
  });
});
