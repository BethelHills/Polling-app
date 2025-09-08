import { NextRequest } from "next/server";

export function createMockRequest(
  methodOrBody: string | any = "POST",
  body: any = null,
  headers: Record<string, string> = {}
): NextRequest {
  const url = "http://localhost:3000/api/polls";
  
  // Handle both signatures: createMockRequest(body) and createMockRequest(method, body)
  let method: string;
  let requestBody: any;
  
  if (typeof methodOrBody === "string") {
    method = methodOrBody;
    requestBody = body;
  } else {
    method = "POST";
    requestBody = methodOrBody;
  }
  
  const init: any = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer test-token", // Add default auth header for tests
      ...headers,
    },
  };

  if (requestBody) {
    init.body = JSON.stringify(requestBody);
  }

  return new NextRequest(url, init);
}

export const mockPollData = {
  title: "Test Poll",
  description: "Test Description",
  options: ["Option 1", "Option 2"],
  valid: {
    title: "Valid Poll",
    description: "Valid Description",
    options: ["Option 1", "Option 2"],
  },
  invalid: {
    title: "",
    description: "",
    options: [],
  },
  duplicateOptions: {
    title: "Duplicate Poll",
    description: "Duplicate Description",
    options: ["Option 1", "Option 1"],
  },
};

export const mockDbResponses = {
  success: {
    data: { id: "123", ...mockPollData },
    error: null,
  },
  error: {
    data: null,
    error: { message: "Database error" },
  },
  successfulPollCreation: {
    data: { id: "123", title: "Test Poll", description: "Test Description" },
    error: null,
  },
  successfulOptionsCreation: {
    data: [{ id: "1", text: "Option 1" }, { id: "2", text: "Option 2" }],
    error: null,
  },
  pollCreationError: {
    data: null,
    error: { message: "Poll creation failed" },
  },
  optionsCreationError: {
    data: null,
    error: { message: "Options creation failed" },
  },
};
