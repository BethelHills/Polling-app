require("@testing-library/jest-dom");

// Mock Web APIs for Node.js environment
global.Request = class MockRequest {
  constructor(input, init = {}) {
    this.url = typeof input === "string" ? input : input.url;
    this.method = init.method || "GET";
    this.headers = new Map(Object.entries(init.headers || {}));
    this.body = init.body;
  }

  async json() {
    return JSON.parse(this.body || "{}");
  }
};

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || "OK";
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  async json() {
    return JSON.parse(this.body || "{}");
  }
};

global.Headers = class MockHeaders extends Map {
  constructor(init = {}) {
    super();
    if (typeof init === "object") {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }
};

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: global.Request,
  NextResponse: {
    json: (data, init = {}) => {
      const response = new global.Response(JSON.stringify(data), {
        status: init.status || 200,
        statusText: init.statusText || "OK",
        headers: {
          "Content-Type": "application/json",
          ...init.headers,
        },
      });
      response.json = () => Promise.resolve(data);
      return response;
    },
  },
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock Next.js server actions will be handled in individual test files

// Mock Supabase client to prevent multiple GoTrueClient instances
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
  supabaseAdmin: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Import the auth mock helper
const { authMockHelper } = require("./__tests__/utils/auth-mock-helper");

// Mock Supabase server client with standardized authentication
jest.mock("@/lib/supabaseServerClient", () => ({
  supabaseServerClient: authMockHelper.createSupabaseMock({
    authenticated: true,
    pollData: { id: "test-poll-id", title: "Test Poll" },
    pollOptionsData: [],
    pollsListData: []
  })
}));

// Mock audit logger to prevent real audit log entries during tests
jest.mock("@/lib/audit-logger", () => {
  const mockAuditLogger = {
    log: jest.fn().mockResolvedValue(undefined),
    logWithRequest: jest.fn().mockResolvedValue(undefined),
    logPollCreated: jest.fn().mockResolvedValue(undefined),
    logPollCreation: jest.fn().mockResolvedValue(undefined),
    logPollUpdate: jest.fn().mockResolvedValue(undefined),
    logPollDeletion: jest.fn().mockResolvedValue(undefined),
    logVote: jest.fn().mockResolvedValue(undefined),
    logPollVoted: jest.fn().mockResolvedValue(undefined),
    logPollViewed: jest.fn().mockResolvedValue(undefined),
    logRateLimitExceeded: jest.fn().mockResolvedValue(undefined),
    logSuspiciousActivity: jest.fn().mockResolvedValue(undefined),
    logSecurityViolation: jest.fn().mockResolvedValue(undefined),
    logLogin: jest.fn().mockResolvedValue(undefined),
    logLogout: jest.fn().mockResolvedValue(undefined),
    logAdminAction: jest.fn().mockResolvedValue(undefined),
    logUserAuthenticated: jest.fn().mockResolvedValue(undefined),
    logUserUnauthorized: jest.fn().mockResolvedValue(undefined),
    extractRequestInfo: jest.fn().mockImplementation((request) => {
      // Check if request has headers and get method
      if (request && request.headers && typeof request.headers.get === 'function') {
        const forwarded = request.headers.get("x-forwarded-for");
        const realIp = request.headers.get("x-real-ip");
        const userAgent = request.headers.get("user-agent");
        const requestId = request.headers.get("x-request-id");
        
        const ip = forwarded ? forwarded.split(",")[0] : realIp || undefined;
        
        return {
          ip_address: ip,
          user_agent: userAgent,
          request_id: requestId
        };
      }
      
      // Fallback for requests without proper headers
      return {
        ip_address: undefined,
        user_agent: undefined,
        request_id: undefined
      };
    }),
  };

  return {
    AuditLogger: {
      getInstance: jest.fn(() => mockAuditLogger),
    },
    auditLogger: mockAuditLogger,
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
    },
    AuditAction: {
      CREATE_POLL: "create_poll",
      UPDATE_POLL: "update_poll",
      DELETE_POLL: "delete_poll",
      VIEW_POLL: "view_poll",
      VOTE: "vote",
      CHANGE_VOTE: "change_vote",
      DELETE_VOTE: "delete_vote",
      LOGIN: "login",
      LOGOUT: "logout",
      REGISTER: "register",
      UPDATE_PROFILE: "update_profile",
      DELETE_ACCOUNT: "delete_account",
      RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
      SUSPICIOUS_ACTIVITY: "suspicious_activity",
      SECURITY_VIOLATION: "security_violation",
      CLEANUP_AUDIT_LOGS: "cleanup_audit_logs",
      ADMIN_ACTION: "admin_action",
      BAN_USER: "ban_user",
      UNBAN_USER: "unban_user",
      MODERATE_POLL: "moderate_poll",
    },
    AuditTargetType: {
      POLL: "poll",
      VOTE: "vote",
      USER: "user",
      SYSTEM: "system",
      ADMIN: "admin",
    },
  };
});

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SECRET_KEY = "test-secret-key";
