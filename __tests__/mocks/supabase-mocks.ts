// Mock Supabase client for testing
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
};

export const mockPoll = {
  id: "test-poll-id",
  title: "Test Poll",
  description: "Test Description",
  created_at: new Date().toISOString(),
  user_id: mockUser.id,
};

export const mockPollOptions = [
  { id: "1", text: "Option 1", poll_id: mockPoll.id },
  { id: "2", text: "Option 2", poll_id: mockPoll.id },
];

export function setupGlobalMocks() {
  // Setup global mocks if needed
}

export function cleanupMocks() {
  // Cleanup mocks if needed
}

export function createApiTestMocks(options: { authenticated?: boolean } = {}) {
  const mockServerClient = createMockSupabaseServerClient();
  
  if (options.authenticated === false) {
    mockServerClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
  }
  
  return {
    mockUser,
    mockPoll,
    mockPollOptions,
    mockServerClient,
    setupGlobalMocks,
    cleanupMocks,
    createMockSupabaseServerClient,
  };
}

export function createMockSupabaseServerClient() {
  return {
    auth: {
      getUser: jest.fn().mockImplementation((token) => {
        // Mock successful authentication for test-token
        if (token === "test-token") {
          return Promise.resolve({ data: { user: mockUser }, error: null });
        }
        // Mock failed authentication for other tokens
        return Promise.resolve({ data: { user: null }, error: { message: "Invalid token" } });
      }),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [mockPoll], error: null }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [mockPoll], error: null }),
      }),
    })),
  };
}
