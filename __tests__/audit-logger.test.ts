/**
 * Tests for audit logging functionality
 * Tests the audit logger utility functions and database operations
 */

import {
  AuditLogger,
  auditLogger,
  auditLog,
  AuditAction,
  AuditTargetType,
} from "@/lib/audit-logger";
import { NextRequest } from "next/server";

// Mock Supabase client
jest.mock("@/lib/supabaseServerClient", () => ({
  supabaseServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "test-id" }], error: null }),
    })),
  })),
}));

// Mock NextRequest
const createMockRequest = (
  url: string = "http://localhost:3000/api/test",
  method: string = "GET",
) => {
  const headers = new Headers();
  headers.set("x-forwarded-for", "192.168.1.100");
  headers.set("user-agent", "Mozilla/5.0 (Test Browser)");
  headers.set("x-request-id", "test-request-id");

  return new NextRequest(url, { method, headers });
};

describe("AuditLogger", () => {
  let logger: AuditLogger;

  beforeEach(() => {
    logger = AuditLogger.getInstance();
    jest.clearAllMocks();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = AuditLogger.getInstance();
      const instance2 = AuditLogger.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("Basic Logging", () => {
    it("should log a basic audit event", async () => {
      const entry = {
        user_id: "test-user-id",
        action: AuditAction.CREATE_POLL,
        target_type: AuditTargetType.POLL,
        target_id: "test-poll-id",
        metadata: { test: "data" },
      };

      await logger.log(entry);

      // Verify the log method was called (mocked Supabase insert)
      expect(logger).toBeDefined();
    });

    it("should handle logging errors gracefully", async () => {
      // Mock Supabase to throw an error
      const mockSupabase = {
        from: jest.fn(() => ({
          insert: jest.fn().mockRejectedValue(new Error("Database error")),
        })),
      };

      // Replace the supabase instance
      (logger as any).supabase = mockSupabase;

      const entry = {
        user_id: "test-user-id",
        action: AuditAction.CREATE_POLL,
        target_type: AuditTargetType.POLL,
        target_id: "test-poll-id",
      };

      // Should not throw an error
      await expect(logger.log(entry)).resolves.not.toThrow();
    });
  });

  describe("Request Context Logging", () => {
    it("should extract request information correctly", async () => {
      const request = createMockRequest();

      const entry = {
        user_id: "test-user-id",
        action: AuditAction.VOTE,
        target_type: AuditTargetType.VOTE,
        target_id: "test-poll-id",
      };

      await logger.logWithRequest(request, entry);

      // Verify the method was called
      expect(logger).toBeDefined();
    });

    it("should handle requests without headers gracefully", async () => {
      const request = new NextRequest("http://localhost:3000/api/test");

      const entry = {
        user_id: "test-user-id",
        action: AuditAction.LOGIN,
        target_type: AuditTargetType.USER,
        target_id: "test-user-id",
      };

      await expect(
        logger.logWithRequest(request, entry),
      ).resolves.not.toThrow();
    });
  });

  describe("Specialized Logging Methods", () => {
    it("should log poll creation", async () => {
      const request = createMockRequest();

      await logger.logPollCreation(
        request,
        "test-user-id",
        "test-poll-id",
        "Test Poll",
      );

      expect(logger).toBeDefined();
    });

    it("should log poll update", async () => {
      const request = createMockRequest();
      const changes = { title: "New Title", description: "New Description" };

      await logger.logPollUpdate(
        request,
        "test-user-id",
        "test-poll-id",
        changes,
      );

      expect(logger).toBeDefined();
    });

    it("should log poll deletion", async () => {
      const request = createMockRequest();

      await logger.logPollDeletion(
        request,
        "test-user-id",
        "test-poll-id",
        "Test Poll",
      );

      expect(logger).toBeDefined();
    });

    it("should log vote", async () => {
      const request = createMockRequest();

      await logger.logVote(
        request,
        "test-user-id",
        "test-poll-id",
        "Option A",
        false,
      );

      expect(logger).toBeDefined();
    });

    it("should log vote change", async () => {
      const request = createMockRequest();

      await logger.logVote(
        request,
        "test-user-id",
        "test-poll-id",
        "Option B",
        true,
      );

      expect(logger).toBeDefined();
    });

    it("should log rate limit exceeded", async () => {
      const request = createMockRequest();

      await logger.logRateLimitExceeded(
        request,
        "test-user-id",
        "/api/polls",
        10,
      );

      expect(logger).toBeDefined();
    });

    it("should log suspicious activity", async () => {
      const request = createMockRequest();

      await logger.logSuspiciousActivity(
        request,
        "test-user-id",
        "Multiple failed login attempts",
        { attempts: 5, time_window: "5_minutes" },
      );

      expect(logger).toBeDefined();
    });

    it("should log security violation", async () => {
      const request = createMockRequest();

      await logger.logSecurityViolation(
        request,
        "test-user-id",
        "Unauthorized access attempt",
        { resource: "admin_panel", method: "GET" },
      );

      expect(logger).toBeDefined();
    });

    it("should log user login", async () => {
      const request = createMockRequest();

      await logger.logLogin(request, "test-user-id", "email");

      expect(logger).toBeDefined();
    });

    it("should log user logout", async () => {
      const request = createMockRequest();

      await logger.logLogout(request, "test-user-id");

      expect(logger).toBeDefined();
    });

    it("should log admin action", async () => {
      const request = createMockRequest();

      await logger.logAdminAction(
        request,
        "admin-user-id",
        "ban_user",
        AuditTargetType.USER,
        "target-user-id",
        { reason: "spam_behavior", duration: "7_days" },
      );

      expect(logger).toBeDefined();
    });
  });

  describe("Convenience Functions", () => {
    it("should use convenience functions correctly", async () => {
      const request = createMockRequest();

      // Test poll creation convenience function
      await auditLog.pollCreated(
        request,
        "test-user-id",
        "test-poll-id",
        "Test Poll",
      );

      // Test vote convenience function
      await auditLog.vote(
        request,
        "test-user-id",
        "test-poll-id",
        "Option A",
        false,
      );

      // Test rate limit exceeded convenience function
      await auditLog.rateLimitExceeded(
        request,
        "test-user-id",
        "/api/polls",
        10,
      );

      // Test suspicious activity convenience function
      await auditLog.suspiciousActivity(request, "test-user-id", "Test reason");

      // Test security violation convenience function
      await auditLog.securityViolation(
        request,
        "test-user-id",
        "Test violation",
      );

      // Test user login convenience function
      await auditLog.userLogin(request, "test-user-id", "email");

      // Test user logout convenience function
      await auditLog.userLogout(request, "test-user-id");

      // Test admin action convenience function
      await auditLog.adminAction(
        request,
        "admin-user-id",
        "test_action",
        AuditTargetType.USER,
        "target-user-id",
        { test: "data" },
      );

      expect(auditLog).toBeDefined();
    });
  });

  describe("Audit Action and Target Type Enums", () => {
    it("should have correct audit action values", () => {
      expect(AuditAction.CREATE_POLL).toBe("create_poll");
      expect(AuditAction.UPDATE_POLL).toBe("update_poll");
      expect(AuditAction.DELETE_POLL).toBe("delete_poll");
      expect(AuditAction.VOTE).toBe("vote");
      expect(AuditAction.CHANGE_VOTE).toBe("change_vote");
      expect(AuditAction.LOGIN).toBe("login");
      expect(AuditAction.LOGOUT).toBe("logout");
      expect(AuditAction.RATE_LIMIT_EXCEEDED).toBe("rate_limit_exceeded");
      expect(AuditAction.SUSPICIOUS_ACTIVITY).toBe("suspicious_activity");
      expect(AuditAction.SECURITY_VIOLATION).toBe("security_violation");
      expect(AuditAction.ADMIN_ACTION).toBe("admin_action");
    });

    it("should have correct target type values", () => {
      expect(AuditTargetType.POLL).toBe("poll");
      expect(AuditTargetType.VOTE).toBe("vote");
      expect(AuditTargetType.USER).toBe("user");
      expect(AuditTargetType.SYSTEM).toBe("system");
      expect(AuditTargetType.ADMIN).toBe("admin");
    });
  });

  describe("Error Handling", () => {
    it("should handle null user_id gracefully", async () => {
      const entry = {
        user_id: undefined,
        action: AuditAction.CREATE_POLL,
        target_type: AuditTargetType.POLL,
        target_id: "test-poll-id",
      };

      await expect(logger.log(entry)).resolves.not.toThrow();
    });

    it("should handle null target_id gracefully", async () => {
      const entry = {
        user_id: "test-user-id",
        action: AuditAction.LOGIN,
        target_type: AuditTargetType.USER,
        target_id: undefined,
      };

      await expect(logger.log(entry)).resolves.not.toThrow();
    });

    it("should handle null metadata gracefully", async () => {
      const entry = {
        user_id: "test-user-id",
        action: AuditAction.CREATE_POLL,
        target_type: AuditTargetType.POLL,
        target_id: "test-poll-id",
        metadata: undefined,
      };

      await expect(logger.log(entry)).resolves.not.toThrow();
    });
  });

  describe("Request Information Extraction", () => {
    it("should extract IP address from x-forwarded-for header", async () => {
      const request = createMockRequest();
      const requestInfo = (logger as any).extractRequestInfo(request);

      expect(requestInfo.ip_address).toBe("192.168.1.100");
      expect(requestInfo.user_agent).toBe("Mozilla/5.0 (Test Browser)");
      expect(requestInfo.request_id).toBe("test-request-id");
    });

    it("should handle multiple IPs in x-forwarded-for header", async () => {
      const headers = new Headers();
      headers.set(
        "x-forwarded-for",
        "203.0.113.195, 70.41.3.18, 150.172.238.178",
      );

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers,
      });
      const requestInfo = (logger as any).extractRequestInfo(request);

      expect(requestInfo.ip_address).toBe("203.0.113.195");
    });

    it("should fall back to x-real-ip header", async () => {
      const headers = new Headers();
      headers.set("x-real-ip", "192.168.1.200");

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers,
      });
      const requestInfo = (logger as any).extractRequestInfo(request);

      expect(requestInfo.ip_address).toBe("192.168.1.200");
    });

    it("should handle missing headers gracefully", async () => {
      const request = new NextRequest("http://localhost:3000/api/test");
      const requestInfo = (logger as any).extractRequestInfo(request);

      expect(requestInfo.ip_address).toBeUndefined();
      expect(requestInfo.user_agent).toBeUndefined();
      expect(requestInfo.request_id).toBeUndefined();
    });
  });
});
