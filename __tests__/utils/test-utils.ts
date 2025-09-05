import { NextRequest } from "next/server";

// Mock Supabase client for testing
export const mockSupabaseClient = {
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
};

// Helper to create a mock NextRequest
export function createMockRequest(
  body: any,
  method: string = "POST",
): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
    method,
    headers: new Headers(),
    url: "http://localhost:3000/api/polls",
    body: JSON.stringify(body),
  } as any;
}

// Mock poll data for testing
export const mockPollData = {
  valid: {
    title: "What is your favorite programming language?",
    description: "Choose your preferred language for web development",
    options: ["JavaScript", "TypeScript", "Python", "Go"],
  },
  invalid: {
    title: "ab", // Too short
    description: "A".repeat(501), // Too long
    options: ["Option 1"], // Too few options
  },
  duplicateOptions: {
    title: "What is your favorite color?",
    description: "Choose your preferred color",
    options: ["Red", "Blue", "Red"], // Duplicate options
  },
};

// Mock database responses
export const mockDbResponses = {
  successfulPollCreation: {
    data: {
      id: "poll-123",
      title: "What is your favorite programming language?",
      description: "Choose your preferred language for web development",
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
    },
    error: null,
  },
  successfulOptionsCreation: {
    data: null,
    error: null,
  },
  pollCreationError: {
    data: null,
    error: { message: "Database connection failed" },
  },
  optionsCreationError: {
    data: null,
    error: { message: "Failed to insert options" },
  },
};
