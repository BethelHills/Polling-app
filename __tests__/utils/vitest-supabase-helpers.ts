/**
 * Vitest Supabase Test Helper Functions
 * Designed to work with vi.mock() pattern for cleaner mocking
 */

import { vi } from 'vitest';

export interface MockUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

export interface AuthConfig {
  authenticated?: boolean;
  user?: MockUser;
  error?: any;
}

export interface DatabaseConfig {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  data?: any;
  error?: any;
}

export interface PollData {
  id: string;
  title: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  total_votes?: number;
  options?: any[];
}

// ============================================================================
// MOCK SETUP FUNCTIONS
// ============================================================================

/**
 * Create a mock Supabase client for vi.mock()
 */
export const createMockSupabaseClient = () => {
  const mockAuth = {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  };

  const createMockQueryBuilder = () => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    csv: vi.fn(),
    geojson: vi.fn(),
    explain: vi.fn(),
    rollback: vi.fn(),
    returns: vi.fn().mockReturnThis(),
    then: vi.fn(),
  });

  const mockFrom = vi.fn().mockImplementation((table: string) => createMockQueryBuilder());

  const mockStorage = {
    from: vi.fn().mockReturnValue({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      getPublicUrl: vi.fn(),
      createSignedUrl: vi.fn(),
      createSignedUrls: vi.fn(),
      update: vi.fn(),
      move: vi.fn(),
      copy: vi.fn(),
    }),
  };

  const mockRealtime = {
    channel: vi.fn().mockReturnValue({
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      send: vi.fn(),
      track: vi.fn(),
      untrack: vi.fn(),
    }),
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn(),
    getChannels: vi.fn(),
  };

  return {
    auth: mockAuth,
    from: mockFrom,
    storage: mockStorage,
    realtime: mockRealtime,
    rpc: vi.fn(),
    rest: vi.fn(),
    schema: vi.fn().mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => createMockQueryBuilder()),
    }),
  };
};

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Setup successful authentication
 */
export const setupSuccessfulAuth = (supabase: any, user?: MockUser) => {
  const defaultUser: MockUser = {
    id: "test-user-id",
    email: "test@example.com",
    user_metadata: {}
  };

  supabase.auth.getUser.mockResolvedValue({
    data: { user: user || defaultUser },
    error: null
  });
};

/**
 * Setup failed authentication
 */
export const setupFailedAuth = (supabase: any, error?: any) => {
  supabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: error || { message: "Invalid token" }
  });
};

/**
 * Setup authentication with custom config
 */
export const setupAuth = (supabase: any, config: AuthConfig) => {
  const { authenticated = true, user, error } = config;
  
  if (authenticated) {
    setupSuccessfulAuth(supabase, user);
  } else {
    setupFailedAuth(supabase, error);
  }
};

// ============================================================================
// DATABASE HELPERS - POLLS
// ============================================================================

/**
 * Setup successful poll creation
 */
export const setupSuccessfulPollCreation = (supabase: any, pollData?: PollData) => {
  const defaultPollData: PollData = {
    id: "test-poll-id",
    title: "Test Poll",
    description: "A test poll",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    total_votes: 0,
    options: []
  };

  supabase.from.mockImplementation((table: string) => {
    if (table === "polls") {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: pollData || defaultPollData,
              error: null
            })
          })
        })
      };
    }
    if (table === "poll_options") {
      return {
        insert: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };
    }
    return {};
  });
};

/**
 * Setup poll creation with error
 */
export const setupPollCreationError = (supabase: any, error?: any) => {
  supabase.from.mockImplementation((table: string) => {
    if (table === "polls") {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: error || { message: "Database error" }
            })
          })
        })
      };
    }
    if (table === "poll_options") {
      return {
        insert: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };
    }
    return {};
  });
};

/**
 * Setup successful polls fetch
 */
export const setupSuccessfulPollsFetch = (supabase: any, pollsData?: PollData[]) => {
  const defaultPollsData: PollData[] = [
    {
      id: "poll-1",
      title: "Poll 1",
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      total_votes: 8,
      options: [
        { id: "option-1", votes: 5 },
        { id: "option-2", votes: 3 }
      ]
    },
    {
      id: "poll-2",
      title: "Poll 2",
      is_active: true,
      created_at: "2024-01-02T00:00:00Z",
      total_votes: 5,
      options: [
        { id: "option-3", votes: 3 },
        { id: "option-4", votes: 2 }
      ]
    }
  ];

  supabase.from.mockImplementation((table: string) => {
    if (table === "polls") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: pollsData || defaultPollsData,
              error: null
            })
          })
        })
      };
    }
    return {};
  });
};

// ============================================================================
// SCENARIO HELPERS
// ============================================================================

/**
 * Setup complete successful poll creation scenario
 */
export const setupSuccessfulPollCreationScenario = (supabase: any, pollData?: PollData) => {
  setupSuccessfulAuth(supabase);
  setupSuccessfulPollCreation(supabase, pollData);
};

/**
 * Setup complete failed poll creation scenario (auth failure)
 */
export const setupFailedPollCreationScenario = (supabase: any, error?: any) => {
  setupFailedAuth(supabase, error);
};

/**
 * Setup complete poll creation scenario with database error
 */
export const setupPollCreationWithDatabaseError = (supabase: any, error?: any) => {
  setupSuccessfulAuth(supabase);
  setupPollCreationError(supabase, error);
};

/**
 * Setup complete successful polls fetch scenario
 */
export const setupSuccessfulPollsFetchScenario = (supabase: any, pollsData?: PollData[]) => {
  setupSuccessfulPollsFetch(supabase, pollsData);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Reset all mocks
 */
export const resetSupabaseMocks = (supabase: any) => {
  vi.clearAllMocks();
  
  // Reset auth mocks
  Object.values(supabase.auth).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      (mock as any).mockClear();
    }
  });
  
  // Reset database mocks
  supabase.from.mockClear();
  
  // Reset storage mocks
  Object.values(supabase.storage).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      (mock as any).mockClear();
    }
  });
  
  // Reset realtime mocks
  Object.values(supabase.realtime).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      (mock as any).mockClear();
    }
  });
};

/**
 * Create a test request with authentication
 */
export const createAuthenticatedRequest = (options: {
  method?: string;
  url?: string;
  body?: any;
  token?: string;
} = {}) => {
  const {
    method = "POST",
    url = "http://localhost:3000/api/polls",
    body = { title: "Test Poll", options: ["Option 1", "Option 2"] },
    token = "valid-token-12345"
  } = options;

  const headers = new Headers();
  headers.set("authorization", `Bearer ${token}`);
  headers.set("content-type", "application/json");

  return {
    method,
    headers,
    url,
    json: vi.fn().mockResolvedValue(body)
  } as any;
};

/**
 * Create a test request without authentication
 */
export const createUnauthenticatedRequest = (options: {
  method?: string;
  url?: string;
  body?: any;
} = {}) => {
  const {
    method = "POST",
    url = "http://localhost:3000/api/polls",
    body = { title: "Test Poll", options: ["Option 1", "Option 2"] }
  } = options;

  const headers = new Headers();
  headers.set("content-type", "application/json");

  return {
    method,
    headers,
    url,
    json: vi.fn().mockResolvedValue(body)
  } as any;
};

/**
 * Create a test request with invalid token
 */
export const createInvalidTokenRequest = (options: {
  method?: string;
  url?: string;
  body?: any;
  token?: string;
} = {}) => {
  const {
    method = "POST",
    url = "http://localhost:3000/api/polls",
    body = { title: "Test Poll", options: ["Option 1", "Option 2"] },
    token = "invalid"
  } = options;

  const headers = new Headers();
  headers.set("authorization", `Bearer ${token}`);
  headers.set("content-type", "application/json");

  return {
    method,
    headers,
    url,
    json: vi.fn().mockResolvedValue(body)
  } as any;
};
