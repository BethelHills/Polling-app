/**
 * Authentication Mock Helper
 * Provides standardized authentication mocking across all test files
 */

export interface MockUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

export interface MockAuthResponse {
  data: { user: MockUser | null };
  error: { message: string } | null;
}

export interface MockDatabaseResponse {
  data: any;
  error: { message: string } | null;
}

export class AuthMockHelper {
  private static instance: AuthMockHelper;
  private mockUser: MockUser;
  private mockSupabaseClient: any;

  constructor() {
    this.mockUser = {
      id: "test-user-id",
      email: "test@example.com",
      user_metadata: {}
    };
  }

  static getInstance(): AuthMockHelper {
    if (!AuthMockHelper.instance) {
      AuthMockHelper.instance = new AuthMockHelper();
    }
    return AuthMockHelper.instance;
  }

  /**
   * Create a standardized Supabase client mock
   */
  createSupabaseMock(options: {
    authenticated?: boolean;
    user?: MockUser;
    pollData?: any;
    pollOptionsData?: any;
    pollsListData?: any;
  } = {}) {
    const {
      authenticated = true,
      user = this.mockUser,
      pollData = { id: "test-poll-id", title: "Test Poll" },
      pollOptionsData = [],
      pollsListData = []
    } = options;

    const mockAuthResponse: MockAuthResponse = authenticated
      ? { data: { user }, error: null }
      : { data: { user: null }, error: { message: "Invalid token" } };

    const mockPollResponse: MockDatabaseResponse = {
      data: pollData,
      error: null
    };

    const mockPollOptionsResponse: MockDatabaseResponse = {
      data: pollOptionsData,
      error: null
    };

    const mockPollsListResponse: MockDatabaseResponse = {
      data: pollsListData,
      error: null
    };

    this.mockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockImplementation((token: string) => {
          // Accept tokens that are at least 10 characters long
          if (token && token.length >= 10) {
            return Promise.resolve(mockAuthResponse);
          }
          return Promise.resolve({
            data: { user: null },
            error: { message: "Invalid token" }
          });
        })
      },
      from: jest.fn().mockImplementation((table: string) => {
        const mockQuery = {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockPollResponse),
              then: jest.fn().mockResolvedValue(mockPollOptionsResponse)
            })
          }),
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue(mockPollsListResponse)
            }),
            order: jest.fn().mockResolvedValue(mockPollsListResponse)
          })
        };

        // Handle different table operations
        if (table === "polls") {
          return {
            ...mockQuery,
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(mockPollResponse)
              })
            })
          };
        }

        if (table === "poll_options") {
          return {
            ...mockQuery,
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                then: jest.fn().mockResolvedValue(mockPollOptionsResponse)
              })
            })
          };
        }

        return mockQuery;
      })
    };

    return this.mockSupabaseClient;
  }

  /**
   * Create a standardized test request with authentication
   */
  createAuthenticatedRequest(options: {
    method?: string;
    url?: string;
    body?: any;
    token?: string;
  } = {}) {
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
  }

  /**
   * Create a request without authentication
   */
  createUnauthenticatedRequest(options: {
    method?: string;
    url?: string;
    body?: any;
  } = {}) {
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
  }

  /**
   * Create a request with invalid token
   */
  createInvalidTokenRequest(options: {
    method?: string;
    url?: string;
    body?: any;
    token?: string;
  } = {}) {
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
  }

  /**
   * Setup global mocks for all tests
   */
  setupGlobalMocks() {
    // Mock the Supabase server client globally
    jest.doMock("@/lib/supabaseServerClient", () => ({
      supabaseServerClient: this.createSupabaseMock({ authenticated: true })
    }));

    // Mock audit logger globally
    jest.doMock("@/lib/audit-logger", () => ({
      auditLog: {
        pollCreated: jest.fn().mockResolvedValue(undefined),
        pollVoted: jest.fn().mockResolvedValue(undefined),
        pollViewed: jest.fn().mockResolvedValue(undefined),
        userAuthenticated: jest.fn().mockResolvedValue(undefined),
        userUnauthorized: jest.fn().mockResolvedValue(undefined),
        vote: jest.fn().mockResolvedValue(undefined),
        pollCreation: jest.fn().mockResolvedValue(undefined),
        pollUpdate: jest.fn().mockResolvedValue(undefined),
        pollDeletion: jest.fn().mockResolvedValue(undefined),
        rateLimitExceeded: jest.fn().mockResolvedValue(undefined),
        suspiciousActivity: jest.fn().mockResolvedValue(undefined),
        securityViolation: jest.fn().mockResolvedValue(undefined),
        login: jest.fn().mockResolvedValue(undefined),
        logout: jest.fn().mockResolvedValue(undefined),
        userLogin: jest.fn().mockResolvedValue(undefined),
        userLogout: jest.fn().mockResolvedValue(undefined),
        adminAction: jest.fn().mockResolvedValue(undefined),
      }
    }));
  }

  /**
   * Override the global mock for specific test scenarios
   */
  overrideGlobalMock(overrideClient: any) {
    // Clear the module cache to force re-import
    jest.resetModules();
    
    // Mock with the override client
    jest.doMock("@/lib/supabaseServerClient", () => ({
      supabaseServerClient: overrideClient
    }));
  }

  /**
   * Reset all mocks
   */
  resetMocks() {
    jest.clearAllMocks();
    this.createSupabaseMock({ authenticated: true });
  }
}

// Export singleton instance
export const authMockHelper = AuthMockHelper.getInstance();

// Export utility functions
export const createAuthMocks = (options?: Parameters<AuthMockHelper['createSupabaseMock']>[0]) => 
  authMockHelper.createSupabaseMock(options);

export const createTestRequest = (options?: Parameters<AuthMockHelper['createAuthenticatedRequest']>[0]) =>
  authMockHelper.createAuthenticatedRequest(options);

export const createUnauthRequest = (options?: Parameters<AuthMockHelper['createUnauthenticatedRequest']>[0]) =>
  authMockHelper.createUnauthenticatedRequest(options);

export const createInvalidTokenRequest = (options?: Parameters<AuthMockHelper['createInvalidTokenRequest']>[0]) =>
  authMockHelper.createInvalidTokenRequest(options);
