/**
 * Examples of using rate limiting in Next.js API routes
 * Demonstrates different patterns and configurations
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RateLimitConfigs, rateLimit } from "@/lib/rate-limiter";

// Example 1: Using withRateLimit wrapper
export async function createPollWithRateLimit(request: NextRequest) {
  const handler = async (req: NextRequest) => {
    // Your poll creation logic here
    const body = await req.json();

    return NextResponse.json({
      success: true,
      message: "Poll created successfully",
      pollId: "123",
    });
  };

  // Apply rate limiting with custom config
  return withRateLimit(handler, {
    ...RateLimitConfigs.CREATE_POLL,
    onLimitReached: (req, key) => {
      console.log(`Rate limit reached for poll creation: ${key}`);
    },
  })(request);
}

// Example 2: Manual rate limiting in API route
export async function voteWithManualRateLimit(request: NextRequest) {
  // Apply rate limiting manually
  const rateLimitResponse = await rateLimit({
    ...RateLimitConfigs.VOTE,
    keyGenerator: (req) => {
      // Custom key generation based on user ID and poll ID
      const pollId = req.nextUrl.pathname.split("/")[3];
      const userId = req.headers.get("x-user-id") || "anonymous";
      return `vote:${pollId}:${userId}`;
    },
  })(request);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Your voting logic here
  const body = await request.json();

  return NextResponse.json({
    success: true,
    message: "Vote submitted successfully",
  });
}

// Example 3: Different rate limits for different user types
export async function searchWithUserBasedRateLimit(request: NextRequest) {
  const isPremiumUser = request.headers.get("x-user-tier") === "premium";

  const rateLimitConfig = isPremiumUser
    ? {
        ...RateLimitConfigs.SEARCH,
        max: 100, // Premium users get higher limits
        message: "Premium rate limit exceeded",
      }
    : RateLimitConfigs.SEARCH;

  const rateLimitResponse = await rateLimit(rateLimitConfig)(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Your search logic here
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  return NextResponse.json({
    success: true,
    results: [],
    query,
  });
}

// Example 4: Rate limiting with custom error handling
export async function analyticsWithCustomErrorHandling(request: NextRequest) {
  const rateLimitResponse = await rateLimit({
    ...RateLimitConfigs.ANALYTICS,
    onLimitReached: (req, key) => {
      // Log the rate limit event
      console.log(`Analytics rate limit reached for key: ${key}`);

      // You could send this to a monitoring service
      // sendToMonitoring('rate_limit_exceeded', { endpoint: 'analytics', key });
    },
  })(request);

  if (rateLimitResponse) {
    // Custom error response
    return NextResponse.json(
      {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message:
          "Too many analytics requests. Please upgrade your plan for higher limits.",
        upgradeUrl: "/pricing",
      },
      { status: 429 },
    );
  }

  // Your analytics logic here
  return NextResponse.json({
    success: true,
    analytics: {
      totalPolls: 100,
      totalVotes: 1000,
    },
  });
}

// Example 5: Rate limiting with IP whitelist
export async function adminEndpointWithWhitelist(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : request.headers.get("x-real-ip") || "unknown";

  // Whitelist admin IPs
  const adminIPs = ["127.0.0.1", "::1", "192.168.1.100"];

  if (adminIPs.includes(ip)) {
    // No rate limiting for admin IPs
    return NextResponse.json({
      success: true,
      message: "Admin access granted",
    });
  }

  // Apply strict rate limiting for non-admin IPs
  const rateLimitResponse = await rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: "Admin endpoint access denied",
  })(request);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return NextResponse.json({
    success: true,
    message: "Access granted",
  });
}

// Example 6: Rate limiting with Redis-like storage (for production)
export async function productionRateLimitExample(request: NextRequest) {
  // In production, you would use Redis or similar
  // This is just an example of how you might structure it

  const rateLimitResponse = await rateLimit({
    ...RateLimitConfigs.GENERAL,
    keyGenerator: (req) => {
      // Use a more sophisticated key generation
      const userId = req.headers.get("x-user-id");
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0];
      return userId ? `user:${userId}` : `ip:${ip}`;
    },
    onLimitReached: (req, key) => {
      // In production, you might:
      // 1. Log to a monitoring service
      // 2. Send alerts
      // 3. Update user reputation scores
      console.log(`Production rate limit reached: ${key}`);
    },
  })(request);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return NextResponse.json({
    success: true,
    message: "Request processed",
  });
}
