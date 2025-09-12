import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web APIs for Node.js environment
global.Request = class MockRequest {
  url: string;
  method: string;
  headers: Headers;
  body: string | null;

  constructor(input: string | { url: string }, init: any = {}) {
    this.url = typeof input === "string" ? input : input.url;
    this.method = init.method || "GET";
    this.headers = new Headers(init.headers || {});
    this.body = init.body || null;
  }

  async json() {
    return JSON.parse(this.body || "{}");
  }
} as any;

global.Response = class MockResponse {
  body: string;
  status: number;
  statusText: string;
  headers: Map<string, string>;

  constructor(body: string, init: any = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || "OK";
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  async json() {
    return JSON.parse(this.body || "{}");
  }
} as any;

global.Headers = class MockHeaders extends Map {
  constructor(init: any = {}) {
    super();
    if (typeof init === "object") {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key.toLowerCase(), value);
      });
    }
  }

  get(name: string) {
    return super.get(name.toLowerCase());
  }

  has(name: string) {
    return super.has(name.toLowerCase());
  }

  set(name: string, value: any) {
    return super.set(name.toLowerCase(), value);
  }

  delete(name: string) {
    return super.delete(name.toLowerCase());
  }
} as any;

// Mock Next.js server components
vi.mock("next/server", () => ({
  NextRequest: global.Request,
  NextResponse: {
    json: (data: any, init: any = {}) => {
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
vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SECRET_KEY = "test-secret-key";
