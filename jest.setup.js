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

// Mock audit logger to prevent real audit log entries during tests
jest.mock("@/lib/audit-logger", () => ({
  auditLog: {
    pollCreated: jest.fn().mockResolvedValue(undefined),
    pollVoted: jest.fn().mockResolvedValue(undefined),
    pollViewed: jest.fn().mockResolvedValue(undefined),
    userAuthenticated: jest.fn().mockResolvedValue(undefined),
    userUnauthorized: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SECRET_KEY = "test-secret-key";
