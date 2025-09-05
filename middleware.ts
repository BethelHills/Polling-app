import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSecurityHeaders } from "@/lib/security-utils";
import { rateLimit, RateLimitConfigs } from "@/lib/rate-limiter";

/**
 * Middleware to add security headers and rate limiting to all responses
 * Provides additional protection beyond React's automatic escaping
 */
export async function middleware(request: NextRequest) {
  // Apply rate limiting for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Determine rate limit config based on endpoint
    let rateLimitConfig = RateLimitConfigs.GENERAL;

    if (
      request.nextUrl.pathname.includes("/polls") &&
      request.method === "POST"
    ) {
      rateLimitConfig = RateLimitConfigs.CREATE_POLL;
    } else if (request.nextUrl.pathname.includes("/vote")) {
      rateLimitConfig = RateLimitConfigs.VOTE;
    } else if (request.nextUrl.pathname.includes("/search")) {
      rateLimitConfig = RateLimitConfigs.SEARCH;
    } else if (request.nextUrl.pathname.includes("/auth")) {
      rateLimitConfig = RateLimitConfigs.AUTH;
    } else if (request.nextUrl.pathname.includes("/analytics")) {
      rateLimitConfig = RateLimitConfigs.ANALYTICS;
    }

    // Apply rate limiting
    const rateLimitResponse = await rateLimit(rateLimitConfig)(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  const response = NextResponse.next();

  // Add security headers
  const securityHeaders = getSecurityHeaders();

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add additional security headers specific to the request
  response.headers.set("X-Request-ID", crypto.randomUUID());

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set(
      "Access-Control-Allow-Origin",
      process.env.NODE_ENV === "production"
        ? "https://yourdomain.com"
        : "http://localhost:3000",
    );
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
