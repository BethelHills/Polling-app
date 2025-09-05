/**
 * Comprehensive Supabase mocking utilities for testing
 * Provides mocks for both client-side and server-side Supabase operations
 */

// Mock user data
export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  created_at: "2023-01-01T00:00:00Z",
};

// Mock poll data
export const mockPoll = {
  id: "poll-123",
  title: "Test Poll",
  description: "Test Description",
  is_active: true,
  owner_id: "user-123",
  created_at: "2023-01-01T00:00:00Z",
};

// Mock poll option data
export const mockPollOptions = [
  {
    id: "option-1",
    poll_id: "poll-123",
    text: "Option 1",
    votes: 5,
    order_index: 0,
  },
  {
    id: "option-2",
    poll_id: "poll-123",
    text: "Option 2",
    votes: 3,
    order_index: 1,
  },
];

// Mock vote data
export const mockVote = {
  id: "vote-123",
  poll_id: "poll-123",
  option_id: "option-1",
  user_id: "user-123",
  created_at: "2023-01-01T00:00:00Z",
};

// Mock audit log data
export const mockAuditLog = {
  id: "audit-123",
  user_id: "user-123",
  action: "poll_created",
  target_id: "poll-123",
  ip_address: "127.0.0.1",
  user_agent: "test-agent",
  created_at: "2023-01-01T00:00:00Z",
};

/**
 * Create a mock Supabase server client
 */
export const createMockSupabaseServerClient = () => ({
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(),
      })),
      order: jest.fn(),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
});

/**
 * Create a mock Supabase client (for client-side operations)
 */
export const createMockSupabaseClient = () => ({
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(),
      })),
      order: jest.fn(),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
});

/**
 * Setup common mock responses for authentication
 */
export const setupAuthMocks = (
  mockClient: any,
  options: {
    user?: any | null;
    error?: any | null;
  } = {},
) => {
  const { user = mockUser, error = null } = options;

  mockClient.auth.getUser.mockResolvedValue({
    data: user ? { user } : null,
    error,
  });

  return mockClient;
};

/**
 * Setup common mock responses for database operations
 */
export const setupDbMocks = (
  mockClient: any,
  options: {
    insertResponse?: any;
    selectResponse?: any;
    updateResponse?: any;
    deleteResponse?: any;
    error?: any;
  } = {},
) => {
  const {
    insertResponse = { data: mockPoll, error: null },
    selectResponse = { data: [mockPoll], error: null },
    updateResponse = { data: mockPoll, error: null },
    deleteResponse = { data: null, error: null },
    error = null,
  } = options;

  const mockFrom = mockClient.from();

  // Mock insert operations
  mockFrom.insert.mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue(insertResponse),
    }),
  });

  // Mock select operations
  mockFrom.select.mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue(selectResponse),
      order: jest.fn().mockResolvedValue(selectResponse),
    }),
    order: jest.fn().mockResolvedValue(selectResponse),
  });

  // Mock update operations
  mockFrom.update.mockReturnValue({
    eq: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue(updateResponse),
      }),
    }),
  });

  // Mock delete operations
  mockFrom.delete.mockReturnValue({
    eq: jest.fn().mockResolvedValue(deleteResponse),
  });

  return mockClient;
};

/**
 * Create a complete mock setup for API route testing
 */
export const createApiTestMocks = (
  options: {
    authenticated?: boolean;
    user?: any;
    dbError?: any;
    authError?: any;
  } = {},
) => {
  const {
    authenticated = true,
    user = mockUser,
    dbError = null,
    authError = null,
  } = options;

  const mockServerClient = createMockSupabaseServerClient();
  const mockClient = createMockSupabaseClient();

  // Setup authentication mocks
  if (authenticated) {
    setupAuthMocks(mockServerClient, { user, error: authError });
  } else {
    setupAuthMocks(mockServerClient, {
      user: null,
      error: authError || new Error("Unauthorized"),
    });
  }

  // Setup database mocks
  setupDbMocks(mockServerClient, { error: dbError });

  return {
    mockServerClient,
    mockClient,
    mockUser: user,
    mockPoll,
    mockPollOptions,
    mockVote,
    mockAuditLog,
  };
};

/**
 * Mock audit logger
 */
export const mockAuditLogger = {
  pollCreated: jest.fn().mockResolvedValue(undefined),
  vote: jest.fn().mockResolvedValue(undefined),
  pollUpdated: jest.fn().mockResolvedValue(undefined),
  pollDeleted: jest.fn().mockResolvedValue(undefined),
  rateLimitExceeded: jest.fn().mockResolvedValue(undefined),
};

/**
 * Mock rate limiter
 */
export const mockRateLimiter = jest.fn().mockResolvedValue(null);

/**
 * Mock environment variables
 */
export const mockEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
};

/**
 * Setup global mocks for all tests
 */
export const setupGlobalMocks = () => {
  // Mock environment variables
  Object.assign(process.env, mockEnvVars);

  // Mock Next.js modules
  jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
  }));

  jest.mock("next/navigation", () => ({
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    })),
    useSearchParams: jest.fn(() => new URLSearchParams()),
    usePathname: jest.fn(() => "/"),
  }));

  // Mock audit logger
  jest.mock("@/lib/audit-logger", () => mockAuditLogger);

  // Mock rate limiter
  jest.mock("@/lib/rate-limiter", () => ({
    rateLimit: mockRateLimiter,
    RateLimitConfigs: {
      GENERAL: { windowMs: 60000, max: 100 },
      CREATE_POLL: { windowMs: 3600000, max: 10 },
      VOTE: { windowMs: 60000, max: 5 },
    },
  }));
};

/**
 * Clean up mocks after tests
 */
export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
};
