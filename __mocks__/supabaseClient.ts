/**
 * Centralized Supabase Client Mock
 * This file provides a standardized mock for Supabase client across all tests
 */

// Mock Supabase Auth
export const mockAuth = {
  getUser: jest.fn(),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
  resetPasswordForEmail: jest.fn(),
  updateUser: jest.fn(),
};

// Mock Supabase Database Query Builder
export const createMockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  containedBy: jest.fn().mockReturnThis(),
  rangeGt: jest.fn().mockReturnThis(),
  rangeGte: jest.fn().mockReturnThis(),
  rangeLt: jest.fn().mockReturnThis(),
  rangeLte: jest.fn().mockReturnThis(),
  rangeAdjacent: jest.fn().mockReturnThis(),
  overlaps: jest.fn().mockReturnThis(),
  textSearch: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  csv: jest.fn(),
  geojson: jest.fn(),
  explain: jest.fn(),
  rollback: jest.fn(),
  returns: jest.fn().mockReturnThis(),
  then: jest.fn(),
});

// Mock Supabase Storage
export const mockStorage = {
  from: jest.fn().mockReturnValue({
    upload: jest.fn(),
    download: jest.fn(),
    remove: jest.fn(),
    list: jest.fn(),
    getPublicUrl: jest.fn(),
    createSignedUrl: jest.fn(),
    createSignedUrls: jest.fn(),
    update: jest.fn(),
    move: jest.fn(),
    copy: jest.fn(),
  }),
};

// Mock Supabase Realtime
export const mockRealtime = {
  channel: jest.fn().mockReturnValue({
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    send: jest.fn(),
    track: jest.fn(),
    untrack: jest.fn(),
  }),
  removeChannel: jest.fn(),
  removeAllChannels: jest.fn(),
  getChannels: jest.fn(),
};

// Main Supabase Client Mock
export const supabase = {
  auth: mockAuth,
  from: jest.fn().mockImplementation((table: string) => createMockQueryBuilder()),
  storage: mockStorage,
  realtime: mockRealtime,
  rpc: jest.fn(),
  rest: jest.fn(),
  schema: jest.fn().mockReturnValue({
    from: jest.fn().mockImplementation((table: string) => createMockQueryBuilder()),
  }),
};

// Server-side Supabase Client Mock (for API routes)
export const supabaseServerClient = {
  auth: mockAuth,
  from: jest.fn().mockImplementation((table: string) => createMockQueryBuilder()),
  storage: mockStorage,
  realtime: mockRealtime,
  rpc: jest.fn(),
  rest: jest.fn(),
  schema: jest.fn().mockReturnValue({
    from: jest.fn().mockImplementation((table: string) => createMockQueryBuilder()),
  }),
};

// Admin Supabase Client Mock
export const supabaseAdmin = {
  auth: {
    ...mockAuth,
    admin: {
      listUsers: jest.fn(),
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUserById: jest.fn(),
      deleteUser: jest.fn(),
      generateLink: jest.fn(),
      inviteUserByEmail: jest.fn(),
    },
  },
  from: jest.fn().mockImplementation((table: string) => createMockQueryBuilder()),
  storage: mockStorage,
  realtime: mockRealtime,
  rpc: jest.fn(),
  rest: jest.fn(),
  schema: jest.fn().mockReturnValue({
    from: jest.fn().mockImplementation((table: string) => createMockQueryBuilder()),
  }),
};

// Helper functions for test setup
export const setupMockAuth = (config: {
  authenticated?: boolean;
  user?: any;
  error?: any;
}) => {
  const { authenticated = true, user = { id: "test-user-id", email: "test@example.com" }, error = null } = config;
  
  mockAuth.getUser.mockResolvedValue({
    data: authenticated ? { user } : { user: null },
    error,
  });
  
  mockAuth.getSession.mockResolvedValue({
    data: authenticated ? { session: { user } } : { session: null },
    error,
  });
};

export const setupMockDatabase = (config: {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  data?: any;
  error?: any;
}) => {
  const { table, operation, data = [], error = null } = config;
  
  const mockQueryBuilder = createMockQueryBuilder();
  
  // Setup the specific operation
  if (operation === 'select') {
    mockQueryBuilder.then.mockResolvedValue({ data, error });
    mockQueryBuilder.single.mockResolvedValue({ data: data[0] || null, error });
    mockQueryBuilder.maybeSingle.mockResolvedValue({ data: data[0] || null, error });
  } else if (operation === 'insert') {
    mockQueryBuilder.then.mockResolvedValue({ data, error });
    mockQueryBuilder.single.mockResolvedValue({ data: data[0] || null, error });
  } else if (operation === 'update') {
    mockQueryBuilder.then.mockResolvedValue({ data, error });
  } else if (operation === 'delete') {
    mockQueryBuilder.then.mockResolvedValue({ data, error });
  }
  
  // Mock the from function to return our configured query builder
  supabase.from.mockImplementation((tableName: string) => {
    if (tableName === table) {
      return mockQueryBuilder;
    }
    return createMockQueryBuilder();
  });
  
  supabaseServerClient.from.mockImplementation((tableName: string) => {
    if (tableName === table) {
      return mockQueryBuilder;
    }
    return createMockQueryBuilder();
  });
};

export const resetSupabaseMocks = () => {
  jest.clearAllMocks();
  
  // Reset auth mocks
  Object.values(mockAuth).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
  
  // Reset database mocks
  supabase.from.mockClear();
  supabaseServerClient.from.mockClear();
  
  // Reset storage mocks
  Object.values(mockStorage).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
  
  // Reset realtime mocks
  Object.values(mockRealtime).forEach(mock => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
};

// Default export
export default supabase;
