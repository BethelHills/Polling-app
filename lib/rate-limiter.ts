/**
 * Rate limiting utilities for Next.js API routes
 * Provides different rate limiting strategies for various endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { auditLog } from "@/lib/audit-logger";

// In-memory store for rate limiting (in production, use Redis or similar)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Reset the rate limit store (for testing)
 */
export function resetRateLimitStore(): void {
  Object.keys(store).forEach((key) => {
    delete store[key];
  });
}

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  },
  5 * 60 * 1000,
);

/**
 * Rate limiting configuration interface
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  onLimitReached?: (req: NextRequest, key: string) => void; // Callback when limit is reached
}

/**
 * Default rate limit configurations for different endpoints
 */
export const RateLimitConfigs = {
  // General API rate limiting
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: "Too many requests from this IP, please try again later.",
  },

  // Poll creation rate limiting
  CREATE_POLL: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 polls per hour
    message: "Too many poll creation attempts, please try again later.",
  },

  // Voting rate limiting
  VOTE: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 votes per minute
    message: "Too many voting attempts, please slow down.",
  },

  // Search rate limiting
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: "Too many search requests, please try again later.",
  },

  // Authentication rate limiting
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 auth attempts per 15 minutes
    message: "Too many authentication attempts, please try again later.",
  },

  // Analytics rate limiting
  ANALYTICS: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 analytics requests per minute
    message: "Too many analytics requests, please try again later.",
  },
};

/**
 * Generate a unique key for rate limiting
 */
function generateKey(req: NextRequest, customKey?: string): string {
  if (customKey) {
    return customKey;
  }

  // Try to get user ID from authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    // Extract user ID from JWT token (simplified)
    try {
      const token = authHeader.replace("Bearer ", "");
      // In a real app, you'd decode the JWT to get the user ID
      // For now, we'll use the token as a key
      return `user:${token.substring(0, 20)}`;
    } catch {
      // Fall back to IP if token parsing fails
    }
  }

  // Fall back to IP address
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

/**
 * Rate limiting middleware function
 */
export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const key = generateKey(req, config.keyGenerator?.(req));
    const now = Date.now();
    // const windowStart = now - config.windowMs;

    // Get or create rate limit entry
    let entry = store[key];
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      store[key] = entry;
    }

    // Check if limit would be exceeded after incrementing
    if (entry.count >= config.max) {
      // Call limit reached callback
      config.onLimitReached?.(req, key);

      // Log rate limit exceeded event
      try {
        await auditLog.rateLimitExceeded(
          req,
          undefined, // userId will be extracted from request if available
          req.nextUrl.pathname,
          config.max,
        );
      } catch (error) {
        console.error("Failed to log rate limit exceeded event:", error);
      }

      // Return rate limit response
      return NextResponse.json(
        {
          success: false,
          message: config.message || "Rate limit exceeded",
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((entry.resetTime - now) / 1000).toString(),
            "X-RateLimit-Limit": config.max.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": entry.resetTime.toString(),
          },
        },
      );
    }

    // Increment counter after checking limit
    entry.count++;

    // Add rate limit headers to successful responses
    const remaining = Math.max(0, config.max - entry.count);
    const resetTime = entry.resetTime;

    // Store headers for the response
    (req as { rateLimitHeaders?: Record<string, string> }).rateLimitHeaders = {
      "X-RateLimit-Limit": config.max.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": resetTime.toString(),
    };

    return null; // Continue to next middleware/handler
  };
}

/**
 * Apply rate limiting to a Next.js API route handler
 */
export function withRateLimit<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  config: RateLimitConfig,
) {
  return async (...args: T): Promise<NextResponse> => {
    const req = args[0] as NextRequest;

    // Apply rate limiting
    const rateLimitResponse = await rateLimit(config)(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Call the original handler
    const response = await handler(...args);

    // Add rate limit headers to the response
    const headers = (req as { rateLimitHeaders?: Record<string, string> })
      .rateLimitHeaders;
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value as string);
      });
    }

    return response;
  };
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(key: string): {
  count: number;
  remaining: number;
  resetTime: number;
  isLimited: boolean;
} | null {
  const entry = store[key];
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (entry.resetTime < now) {
    return null;
  }

  return {
    count: entry.count,
    remaining: Math.max(0, 100 - entry.count), // Assuming max of 100
    resetTime: entry.resetTime,
    isLimited: entry.count >= 100,
  };
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string): boolean {
  if (store[key]) {
    delete store[key];
    return true;
  }
  return false;
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): {
  totalKeys: number;
  activeKeys: number;
  memoryUsage: number;
} {
  const now = Date.now();
  const activeKeys = Object.keys(store).filter(
    (key) => store[key].resetTime >= now,
  );

  return {
    totalKeys: Object.keys(store).length,
    activeKeys: activeKeys.length,
    memoryUsage: JSON.stringify(store).length,
  };
}
