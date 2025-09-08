import { NextRequest } from "next/server";

export function createMockRequest(
  method: string = "POST",
  body: any = null,
  headers: Record<string, string> = {}
): NextRequest {
  const url = "http://localhost:3000/api/polls";
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init);
}

export const mockPollData = {
  title: "Test Poll",
  description: "Test Description",
  options: ["Option 1", "Option 2"],
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
};
