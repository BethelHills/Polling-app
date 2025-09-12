/**
 * Improved Mock Helper for Supabase
 * This provides a cleaner API for setting up Supabase mocks in tests
 */

export interface MockUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

export interface MockAuthConfig {
  authenticated?: boolean;
  user?: MockUser;
  error?: any;
}

export interface MockDatabaseConfig {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  data?: any;
  error?: any;
}

export class ImprovedMockHelper {
  private static instance: ImprovedMockHelper;
  private mockSupabaseClient: any;

  static getInstance(): ImprovedMockHelper {
    if (!ImprovedMockHelper.instance) {
      ImprovedMockHelper.instance = new ImprovedMockHelper();
    }
    return ImprovedMockHelper.instance;
  }

  /**
   * Setup authentication mock
   */
  setupAuth(config: MockAuthConfig = {}) {
    const { authenticated = true, user = { id: "test-user-id", email: "test@example.com" }, error = null } = config;
    
    // Get the current mocked client
    const { supabaseServerClient } = require("@/lib/supabaseServerClient");
    this.mockSupabaseClient = supabaseServerClient;

    // Setup auth mock
    this.mockSupabaseClient.auth.getUser.mockImplementation((token: string) => {
      if (!authenticated || (token && token.length < 10)) {
        return Promise.resolve({
          data: { user: null },
          error: error || { message: "Invalid token" }
        });
      }
      return Promise.resolve({
        data: { user },
        error: null
      });
    });
  }

  /**
   * Setup database operation mock
   */
  setupDatabase(config: MockDatabaseConfig) {
    const { table, operation, data = [], error = null } = config;
    
    if (!this.mockSupabaseClient) {
      const { supabaseServerClient } = require("@/lib/supabaseServerClient");
      this.mockSupabaseClient = supabaseServerClient;
    }

    // Create mock query builder
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
    if (!this.mockSupabaseClient._tableMocks) {
      this.mockSupabaseClient._tableMocks = {};
    }
    this.mockSupabaseClient._tableMocks[`${table}_${operation}`] = mockQueryBuilder;

    // Mock the from function for this specific table
    this.mockSupabaseClient.from.mockImplementation((tableName: string) => {
      // Check if we have a specific mock for this table
      const specificMock = this.mockSupabaseClient._tableMocks?.[`${tableName}_${operation}`];
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
  }

  /**
   * Setup multiple database operations
   */
  setupMultipleDatabase(configs: MockDatabaseConfig[]) {
    configs.forEach(config => this.setupDatabase(config));
  }

  /**
   * Reset all mocks
   */
  reset() {
    jest.clearAllMocks();
    
    // Reset the global mock
    if (typeof (global as any).resetSupabaseMocks === 'function') {
      (global as any).resetSupabaseMocks();
    }
  }

  /**
   * Get the current mock client (for debugging)
   */
  getMockClient() {
    return this.mockSupabaseClient;
  }
}

// Export singleton instance
export const mockHelper = ImprovedMockHelper.getInstance();

// Export convenience functions
export const setupAuth = (config?: MockAuthConfig) => mockHelper.setupAuth(config);
export const setupDatabase = (config: MockDatabaseConfig) => mockHelper.setupDatabase(config);
export const setupMultipleDatabase = (configs: MockDatabaseConfig[]) => mockHelper.setupMultipleDatabase(configs);
export const resetMocks = () => mockHelper.reset();
