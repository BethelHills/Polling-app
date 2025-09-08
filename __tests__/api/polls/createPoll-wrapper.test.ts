import "@testing-library/jest-dom";
import { POST } from "@/app/api/polls/route";
import { createMockRequest } from "../../utils/test-utils.ts.bak";

// Mock the Supabase client
jest.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

// Wrapper function to match your preferred API
async function createPoll(data: {
  title: string;
  description?: string;
  options: string[];
}) {
  const mockRequest = createMockRequest(data);
  const response = await POST(mockRequest);
  const responseData = await response.json();

  if (response.status === 201) {
    return {
      success: true,
      data: responseData.poll,
      pollId: responseData.pollId,
    };
  } else {
    return {
      success: false,
      error: responseData.message,
      errors: responseData.errors,
    };
  }
}

describe("Poll Creation API - Wrapper Function Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an error message when no title is provided", async () => {
    const response = await createPoll({ title: "", options: [] });

    expect(response.success).toBe(false);
    expect(response.error).toBe("Validation failed");
    expect(response.errors).toBeDefined();

    // Check for specific validation error
    const titleError = response.errors?.find(
      (err: any) => err.field === "title",
    );
    expect(titleError).toBeDefined();
    expect(titleError?.message).toContain("at least 3 characters");
  });

  it("should return an error message when title is too short", async () => {
    const response = await createPoll({ title: "ab", options: ["Yes", "No"] });

    expect(response.success).toBe(false);
    expect(response.error).toBe("Validation failed");

    const titleError = response.errors?.find(
      (err: any) => err.field === "title",
    );
    expect(titleError?.message).toBe("Title must be at least 3 characters");
  });

  it("should return an error message when no options are provided", async () => {
    const response = await createPoll({ title: "Valid Title", options: [] });

    expect(response.success).toBe(false);
    expect(response.error).toBe("Validation failed");

    const optionsError = response.errors?.find(
      (err: any) => err.field === "options",
    );
    expect(optionsError?.message).toBe("At least 2 options are required");
  });

  it("should return an error message when only one option is provided", async () => {
    const response = await createPoll({
      title: "Valid Title",
      options: ["Only Option"],
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe("Validation failed");

    const optionsError = response.errors?.find(
      (err: any) => err.field === "options",
    );
    expect(optionsError?.message).toBe("At least 2 options are required");
  });

  it("should return an error message when options are duplicated", async () => {
    const response = await createPoll({
      title: "Valid Title",
      options: ["Same Option", "Same Option"],
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe("Validation failed");

    const optionsError = response.errors?.find(
      (err: any) => err.field === "options",
    );
    expect(optionsError?.message).toBe("Options must be unique");
  });
});
