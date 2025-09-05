# 🚦 Rate Limiting Guide

## 🎯 **Overview**

Rate limiting is a crucial security feature that protects your polling application from abuse, spam, and DoS attacks. This guide shows you how to implement comprehensive rate limiting using `express-rate-limit` patterns adapted for Next.js.

## ✅ **What We've Implemented**

### **1. 🛡️ Comprehensive Rate Limiting System**

#### **Core Components:**

- **`lib/rate-limiter.ts`**: Core rate limiting utilities
- **`middleware.ts`**: Global rate limiting middleware
- **`examples/RateLimitExamples.ts`**: Usage examples
- **Pre-configured rate limits** for different endpoints

#### **Rate Limit Configurations:**

```typescript
export const RateLimitConfigs = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
  },
  CREATE_POLL: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 polls per hour
  },
  VOTE: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 votes per minute
  },
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 auth attempts per 15 minutes
  },
  ANALYTICS: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 analytics requests per minute
  },
};
```

## 🚀 **Usage Patterns**

### **✅ 1. Global Middleware (Automatic)**

Rate limiting is automatically applied to all API routes through middleware:

```typescript
// middleware.ts automatically applies rate limiting based on endpoint
// No additional code needed in your API routes!
```

**Endpoints automatically protected:**

- `/api/polls` (POST) → 10 polls per hour
- `/api/polls/[id]/vote` → 5 votes per minute
- `/api/polls/search` → 30 searches per minute
- `/api/polls/[id]/analytics` → 20 analytics per minute
- All other `/api/*` → 100 requests per 15 minutes

### **✅ 2. Manual Rate Limiting in API Routes**

```typescript
import { rateLimit, RateLimitConfigs } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  // Apply rate limiting manually
  const rateLimitResponse = await rateLimit(RateLimitConfigs.CREATE_POLL)(
    request,
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Your API logic here
  return NextResponse.json({ success: true });
}
```

### **✅ 3. Using the withRateLimit Wrapper**

```typescript
import { withRateLimit, RateLimitConfigs } from "@/lib/rate-limiter";

const handler = async (request: NextRequest) => {
  // Your API logic here
  return NextResponse.json({ success: true });
};

export const POST = withRateLimit(handler, RateLimitConfigs.VOTE);
```

### **✅ 4. Custom Rate Limiting**

```typescript
const customConfig = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per 5 minutes
  message: "Custom rate limit exceeded",
  keyGenerator: (req) => {
    // Custom key generation logic
    const userId = req.headers.get("x-user-id");
    return `user:${userId}`;
  },
  onLimitReached: (req, key) => {
    console.log(`Rate limit reached for key: ${key}`);
  },
};

const rateLimitResponse = await rateLimit(customConfig)(request);
```

## 🎯 **Rate Limiting Strategies**

### **✅ 1. IP-Based Rate Limiting (Default)**

```typescript
// Automatically uses IP address as the key
const rateLimitResponse = await rateLimit(RateLimitConfigs.GENERAL)(request);
```

### **✅ 2. User-Based Rate Limiting**

```typescript
const rateLimitResponse = await rateLimit({
  ...RateLimitConfigs.GENERAL,
  keyGenerator: (req) => {
    const userId = req.headers.get("x-user-id");
    return userId ? `user:${userId}` : `ip:${req.ip}`;
  },
})(request);
```

### **✅ 3. Endpoint-Specific Rate Limiting**

```typescript
const rateLimitResponse = await rateLimit({
  ...RateLimitConfigs.VOTE,
  keyGenerator: (req) => {
    const pollId = req.nextUrl.pathname.split("/")[3];
    const userId = req.headers.get("x-user-id");
    return `vote:${pollId}:${userId}`;
  },
})(request);
```

### **✅ 4. Tier-Based Rate Limiting**

```typescript
const isPremiumUser = request.headers.get("x-user-tier") === "premium";

const rateLimitConfig = isPremiumUser
  ? { ...RateLimitConfigs.SEARCH, max: 100 } // Higher limits for premium
  : RateLimitConfigs.SEARCH; // Standard limits

const rateLimitResponse = await rateLimit(rateLimitConfig)(request);
```

## 🛡️ **Security Features**

### **✅ 1. Rate Limit Headers**

Every response includes rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200000
Retry-After: 900
```

### **✅ 2. Custom Error Messages**

```typescript
const rateLimitResponse = await rateLimit({
  ...RateLimitConfigs.CREATE_POLL,
  message: "Too many poll creation attempts. Please try again later.",
})(request);
```

### **✅ 3. Callback Functions**

```typescript
const rateLimitResponse = await rateLimit({
  ...RateLimitConfigs.GENERAL,
  onLimitReached: (req, key) => {
    // Log the event
    console.log(`Rate limit exceeded: ${key}`);

    // Send to monitoring service
    // sendToMonitoring('rate_limit_exceeded', { key, endpoint: req.url });
  },
})(request);
```

### **✅ 4. IP Whitelisting**

```typescript
const adminIPs = ["127.0.0.1", "::1", "192.168.1.100"];
const ip = request.headers.get("x-forwarded-for")?.split(",")[0];

if (adminIPs.includes(ip)) {
  // Skip rate limiting for admin IPs
  return NextResponse.json({ success: true });
}
```

## 📊 **Monitoring and Management**

### **✅ 1. Rate Limit Status**

```typescript
import { getRateLimitStatus } from "@/lib/rate-limiter";

const status = getRateLimitStatus("user:123");
console.log(status);
// {
//   count: 5,
//   remaining: 95,
//   resetTime: 1640995200000,
//   isLimited: false
// }
```

### **✅ 2. Rate Limit Statistics**

```typescript
import { getRateLimitStats } from "@/lib/rate-limiter";

const stats = getRateLimitStats();
console.log(stats);
// {
//   totalKeys: 150,
//   activeKeys: 75,
//   memoryUsage: 1024
// }
```

### **✅ 3. Reset Rate Limits**

```typescript
import { resetRateLimit } from "@/lib/rate-limiter";

// Reset rate limit for a specific key
const success = resetRateLimit("user:123");
```

## 🎯 **Production Considerations**

### **✅ 1. Redis Integration (Recommended)**

For production, replace the in-memory store with Redis:

```typescript
// lib/redis-rate-limiter.ts
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function redisRateLimit(
  key: string,
  windowMs: number,
  max: number,
) {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const redisKey = `rate_limit:${key}:${window}`;

  const current = await redis.incr(redisKey);
  if (current === 1) {
    await redis.expire(redisKey, Math.ceil(windowMs / 1000));
  }

  return {
    count: current,
    remaining: Math.max(0, max - current),
    resetTime: (window + 1) * windowMs,
    isLimited: current > max,
  };
}
```

### **✅ 2. Database Integration**

```typescript
// Store rate limit events in database for analytics
const rateLimitEvent = {
  key: "user:123",
  endpoint: "/api/polls",
  timestamp: new Date(),
  ip: request.ip,
  userAgent: request.headers.get("user-agent"),
};

await db.rateLimitEvents.create(rateLimitEvent);
```

### **✅ 3. Monitoring Integration**

```typescript
// Send rate limit events to monitoring service
const rateLimitResponse = await rateLimit({
  ...RateLimitConfigs.GENERAL,
  onLimitReached: async (req, key) => {
    await fetch("https://monitoring-service.com/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "rate_limit_exceeded",
        key,
        endpoint: req.url,
        timestamp: new Date().toISOString(),
      }),
    });
  },
})(request);
```

## 🧪 **Testing Rate Limits**

### **✅ 1. Unit Tests**

```typescript
import { rateLimit, RateLimitConfigs } from "@/lib/rate-limiter";

describe("Rate Limiting", () => {
  it("should allow requests within limit", async () => {
    const request = new NextRequest("http://localhost:3000/api/test");
    const response = await rateLimit(RateLimitConfigs.GENERAL)(request);
    expect(response).toBeNull(); // No rate limit response
  });

  it("should block requests exceeding limit", async () => {
    const request = new NextRequest("http://localhost:3000/api/test");

    // Make requests up to the limit
    for (let i = 0; i < 100; i++) {
      await rateLimit(RateLimitConfigs.GENERAL)(request);
    }

    // This should be rate limited
    const response = await rateLimit(RateLimitConfigs.GENERAL)(request);
    expect(response?.status).toBe(429);
  });
});
```

### **✅ 2. Integration Tests**

```typescript
describe("API Rate Limiting", () => {
  it("should rate limit poll creation", async () => {
    const response = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test Poll", options: ["A", "B"] }),
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });
});
```

## 🎉 **Benefits of This Implementation**

### **✅ Security Benefits**

- **DoS Protection**: Prevents overwhelming your server
- **Spam Prevention**: Limits poll creation and voting abuse
- **Resource Protection**: Prevents excessive API usage
- **Cost Control**: Reduces server costs from abuse

### **✅ User Experience Benefits**

- **Fair Usage**: Ensures all users get fair access
- **Clear Feedback**: Users know when they've hit limits
- **Graceful Degradation**: Service remains available for legitimate users

### **✅ Operational Benefits**

- **Monitoring**: Track rate limit events and patterns
- **Analytics**: Understand usage patterns and abuse attempts
- **Flexibility**: Easy to adjust limits based on needs
- **Scalability**: Works with distributed systems

## 🚀 **Next Steps**

1. **Monitor Rate Limit Events**: Set up logging and monitoring
2. **Adjust Limits**: Fine-tune based on actual usage patterns
3. **Implement Redis**: For production scalability
4. **Add User Tiers**: Different limits for different user types
5. **Set Up Alerts**: Get notified of rate limit abuse patterns

Your polling application now has enterprise-grade rate limiting protection! 🛡️
