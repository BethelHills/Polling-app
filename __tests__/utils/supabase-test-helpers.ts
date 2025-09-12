/**
 * Supabase Test Helper Functions
 * Centralized helper functions to reduce duplication and standardize mock patterns
 */

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

export interface PollOptionsData {
  id: string;
  text: string;
  votes: number;
  poll_id?: string;
}

/**
 * Get the mocked Supabase client
 */
export const getMockSupabaseClient = () => {
  const { supabaseServerClient } = require("@/lib/supabaseServerClient");
  return supabaseServerClient;
};

/**
 * Reset all mocks and get a fresh client
 */
export const resetAndGetMockClient = () => {
  jest.clearAllMocks();
  return getMockSupabaseClient();
};

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Setup successful authentication
 */
export const setupSuccessfulAuth = (client: any, user?: MockUser) => {
  const defaultUser: MockUser = {
    id: "test-user-id",
    email: "test@example.com",
    user_metadata: {}
  };

  client.auth.getUser.mockResolvedValue({
    data: { user: user || defaultUser },
    error: null
  });
};

/**
 * Setup failed authentication
 */
export const setupFailedAuth = (client: any, error?: any) => {
  client.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: error || { message: "Invalid token" }
  });
};

/**
 * Setup authentication with custom config
 */
export const setupAuth = (client: any, config: AuthConfig) => {
  const { authenticated = true, user, error } = config;
  
  if (authenticated) {
    setupSuccessfulAuth(client, user);
  } else {
    setupFailedAuth(client, error);
  }
};

// ============================================================================
// DATABASE HELPERS - POLLS
// ============================================================================

/**
 * Setup successful poll creation
 */
export const setupSuccessfulPollCreation = (client: any, pollData?: PollData) => {
  const defaultPollData: PollData = {
    id: "test-poll-id",
    title: "Test Poll",
    description: "A test poll",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    total_votes: 0,
    options: []
  };

  client.from.mockImplementation((table: string) => {
    if (table === "polls") {
      return {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: pollData || defaultPollData,
              error: null
            })
          })
        })
      };
    }
    if (table === "poll_options") {
      return {
        insert: jest.fn().mockResolvedValue({
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
export const setupPollCreationError = (client: any, error?: any) => {
  client.from.mockImplementation((table: string) => {
    if (table === "polls") {
      return {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: error || { message: "Database error" }
            })
          })
        })
      };
    }
    if (table === "poll_options") {
      return {
        insert: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };
    }
    return {};
  });
};

/**
 * Setup poll options creation error
 */
export const setupPollOptionsError = (client: any, error?: any) => {
  client.from.mockImplementation((table: string) => {
    if (table === "polls") {
      return {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "test-poll-id", title: "Test Poll" },
              error: null
            })
          })
        })
      };
    }
    if (table === "poll_options") {
      return {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: error || { message: "Options error" }
        })
      };
    }
    return {};
  });
};

// ============================================================================
// DATABASE HELPERS - POLLS LIST
// ============================================================================

/**
 * Setup successful polls fetch
 */
export const setupSuccessfulPollsFetch = (client: any, pollsData?: PollData[]) => {
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

  client.from.mockImplementation((table: string) => {
    if (table === "polls") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
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

/**
 * Setup polls fetch with error
 */
export const setupPollsFetchError = (client: any, error?: any) => {
  client.from.mockImplementation((table: string) => {
    if (table === "polls") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: error || { message: "Database error" }
            })
          })
        })
      };
    }
    return {};
  });
};

// ============================================================================
// GENERIC DATABASE HELPERS
// ============================================================================

/**
 * Setup generic database operation
 */
export const setupDatabaseOperation = (client: any, config: DatabaseConfig) => {
  const { table, operation, data = [], error = null } = config;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    then: jest.fn(),
  };

  // Setup the specific operation
  if (operation === 'select') {
    mockQueryBuilder.then.mockResolvedValue({ data, error });
    mockQueryBuilder.single.mockResolvedValue({ data: data[0] || null, error });
  } else if (operation === 'insert') {
    mockQueryBuilder.then.mockResolvedValue({ data, error });
    mockQueryBuilder.single.mockResolvedValue({ data: data[0] || null, error });
  } else if (operation === 'update') {
    mockQueryBuilder.then.mockResolvedValue({ data, error });
  } else if (operation === 'delete') {
    mockQueryBuilder.then.mockResolvedValue({ data, error });
  }

  // Store the mock for this table/operation combination
  if (!client._tableMocks) {
    client._tableMocks = {};
  }
  client._tableMocks[`${table}_${operation}`] = mockQueryBuilder;

  // Mock the from function for this specific table
  client.from.mockImplementation((tableName: string) => {
    const specificMock = client._tableMocks?.[`${tableName}_${operation}`];
    if (specificMock) {
      return specificMock;
    }
    
    // Fallback to default mock behavior
    return {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
  });
};

/**
 * Setup multiple database operations
 */
export const setupMultipleDatabaseOperations = (client: any, configs: DatabaseConfig[]) => {
  configs.forEach(config => setupDatabaseOperation(client, config));
};

// ============================================================================
// COMMON TEST SCENARIOS
// ============================================================================

/**
 * Setup complete successful poll creation scenario
 */
export const setupSuccessfulPollCreationScenario = (client: any, pollData?: PollData) => {
  setupSuccessfulAuth(client);
  setupSuccessfulPollCreation(client, pollData);
};

/**
 * Setup complete failed poll creation scenario (auth failure)
 */
export const setupFailedPollCreationScenario = (client: any, error?: any) => {
  setupFailedAuth(client, error);
};

/**
 * Setup complete poll creation scenario with database error
 */
export const setupPollCreationWithDatabaseError = (client: any, error?: any) => {
  setupSuccessfulAuth(client);
  setupPollCreationError(client, error);
};

/**
 * Setup complete poll creation scenario with options error
 */
export const setupPollCreationWithOptionsError = (client: any, error?: any) => {
  setupSuccessfulAuth(client);
  setupPollOptionsError(client, error);
};

/**
 * Setup complete successful polls fetch scenario
 */
export const setupSuccessfulPollsFetchScenario = (client: any, pollsData?: PollData[]) => {
  setupSuccessfulPollsFetch(client, pollsData);
};

/**
 * Setup complete failed polls fetch scenario
 */
export const setupFailedPollsFetchScenario = (client: any, error?: any) => {
  setupPollsFetchError(client, error);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
    json: jest.fn().mockResolvedValue(body)
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
    json: jest.fn().mockResolvedValue(body)
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
    json: jest.fn().mockResolvedValue(body)
  } as any;
};
