/**
 * Audit logging utility for tracking critical user actions
 * Provides comprehensive logging for security monitoring and incident investigation
 */

import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

// Audit log action types
export enum AuditAction {
  // Poll actions
  CREATE_POLL = "create_poll",
  UPDATE_POLL = "update_poll",
  DELETE_POLL = "delete_poll",
  VIEW_POLL = "view_poll",

  // Vote actions
  VOTE = "vote",
  CHANGE_VOTE = "change_vote",
  DELETE_VOTE = "delete_vote",

  // User actions
  LOGIN = "login",
  LOGOUT = "logout",
  REGISTER = "register",
  UPDATE_PROFILE = "update_profile",
  DELETE_ACCOUNT = "delete_account",

  // System actions
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  SECURITY_VIOLATION = "security_violation",
  CLEANUP_AUDIT_LOGS = "cleanup_audit_logs",

  // Admin actions
  ADMIN_ACTION = "admin_action",
  BAN_USER = "ban_user",
  UNBAN_USER = "unban_user",
  MODERATE_POLL = "moderate_poll",
}

// Target types for audit logs
export enum AuditTargetType {
  POLL = "poll",
  VOTE = "vote",
  USER = "user",
  SYSTEM = "system",
  ADMIN = "admin",
}

// Audit log entry interface
export interface AuditLogEntry {
  user_id?: string;
  action: AuditAction;
  target_type: AuditTargetType;
  target_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  metadata?: Record<string, unknown>;
}

// Audit logger class
export class AuditLogger {
  private static instance: AuditLogger;
  private supabase = supabaseServerClient;

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Extract request information for audit logging
   */
  private extractRequestInfo(request: NextRequest): {
    ip_address?: string;
    user_agent?: string;
    request_id?: string;
  } {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || undefined;
    const user_agent = request.headers.get("user-agent") || undefined;
    const request_id = request.headers.get("x-request-id") || undefined;

    return {
      ip_address: ip,
      user_agent,
      request_id,
    };
  }

  /**
   * Log an audit event
   */
  public async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { data, error } = await this.supabase.from("audit_logs").insert([
        {
          user_id: entry.user_id || null,
          action: entry.action,
          target_type: entry.target_type,
          target_id: entry.target_id || null,
          ip_address: entry.ip_address || null,
          user_agent: entry.user_agent || null,
          request_id: entry.request_id || null,
          metadata: entry.metadata || null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Failed to log audit event:", error);
        // Don't throw error to avoid breaking the main flow
      }
    } catch (error) {
      console.error("Audit logging error:", error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Log an audit event with request context
   */
  public async logWithRequest(
    request: NextRequest,
    entry: Omit<AuditLogEntry, "ip_address" | "user_agent" | "request_id">,
  ): Promise<void> {
    const requestInfo = this.extractRequestInfo(request);

    await this.log({
      ...entry,
      ...requestInfo,
    });
  }

  /**
   * Log poll creation
   */
  public async logPollCreation(
    request: NextRequest,
    userId: string,
    pollId: string,
    pollTitle: string,
  ): Promise<void> {
    await this.logWithRequest(request, {
      user_id: userId,
      action: AuditAction.CREATE_POLL,
      target_type: AuditTargetType.POLL,
      target_id: pollId,
      metadata: {
        poll_title: pollTitle,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log poll update
   */
  public async logPollUpdate(
    request: NextRequest,
    userId: string,
    pollId: string,
    changes: Record<string, unknown>,
  ): Promise<void> {
    await this.logWithRequest(request, {
      user_id: userId,
      action: AuditAction.UPDATE_POLL,
      target_type: AuditTargetType.POLL,
      target_id: pollId,
      metadata: {
        changes,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log poll deletion
   */
  public async logPollDeletion(
    request: NextRequest,
    userId: string,
    pollId: string,
    pollTitle: string,
  ): Promise<void> {
    await this.logWithRequest(request, {
      user_id: userId,
      action: AuditAction.DELETE_POLL,
      target_type: AuditTargetType.POLL,
      target_id: pollId,
      metadata: {
        poll_title: pollTitle,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log voting action
   */
  public async logVote(
    request: NextRequest,
    userId: string,
    pollId: string,
    option: string,
    isChange: boolean = false,
  ): Promise<void> {
    await this.logWithRequest(request, {
      user_id: userId,
      action: isChange ? AuditAction.CHANGE_VOTE : AuditAction.VOTE,
      target_type: AuditTargetType.VOTE,
      target_id: pollId,
      metadata: {
        option,
        is_change: isChange,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log rate limit exceeded
   */
  public async logRateLimitExceeded(
    request: NextRequest,
    userId?: string,
    endpoint?: string,
    limit?: number,
  ): Promise<void> {
    await this.logWithRequest(request, {
      user_id: userId,
      action: AuditAction.RATE_LIMIT_EXCEEDED,
      target_type: AuditTargetType.SYSTEM,
      metadata: {
        endpoint,
        limit,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log suspicious activity
   */
  public async logSuspiciousActivity(
    request: NextRequest,
    userId?: string,
    reason: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.logWithRequest(request, {
      user_id: userId,
      action: AuditAction.SUSPICIOUS_ACTIVITY,
      target_type: AuditTargetType.SYSTEM,
      metadata: {
        reason,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log security violation
   */
  public async logSecurityViolation(
    request: NextRequest,
    userId?: string,
    violation: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.logWithRequest(request, {
      user_id: userId,
      action: AuditAction.SECURITY_VIOLATION,
      target_type: AuditTargetType.SYSTEM,
      metadata: {
        violation,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log user login
   */
  public async logLogin(
    request: NextRequest,
    userId: string,
    method: string = "email",
  ): Promise<void> {
    await this.logWithRequest(request, {
      user_id: userId,
      action: AuditAction.LOGIN,
      target_type: AuditTargetType.USER,
      target_id: userId,
      metadata: {
        login_method: method,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log user logout
   */
  public async logLogout(request: NextRequest, userId: string): Promise<void> {
    await this.logWithRequest(request, {
      user_id: userId,
      action: AuditAction.LOGOUT,
      target_type: AuditTargetType.USER,
      target_id: userId,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log admin action
   */
  public async logAdminAction(
    request: NextRequest,
    adminUserId: string,
    action: string,
    targetType: AuditTargetType,
    targetId?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.logWithRequest(request, {
      user_id: adminUserId,
      action: AuditAction.ADMIN_ACTION,
      target_type: targetType,
      target_id: targetId,
      metadata: {
        admin_action: action,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Convenience functions for common audit logging scenarios
export const auditLog = {
  /**
   * Log poll creation
   */
  pollCreated: async (
    request: NextRequest,
    userId: string,
    pollId: string,
    pollTitle: string,
  ) => {
    await auditLogger.logPollCreation(request, userId, pollId, pollTitle);
  },

  /**
   * Log poll update
   */
  pollUpdated: async (
    request: NextRequest,
    userId: string,
    pollId: string,
    changes: Record<string, unknown>,
  ) => {
    await auditLogger.logPollUpdate(request, userId, pollId, changes);
  },

  /**
   * Log poll deletion
   */
  pollDeleted: async (
    request: NextRequest,
    userId: string,
    pollId: string,
    pollTitle: string,
  ) => {
    await auditLogger.logPollDeletion(request, userId, pollId, pollTitle);
  },

  /**
   * Log vote
   */
  vote: async (
    request: NextRequest,
    userId: string,
    pollId: string,
    option: string,
    isChange: boolean = false,
  ) => {
    await auditLogger.logVote(request, userId, pollId, option, isChange);
  },

  /**
   * Log rate limit exceeded
   */
  rateLimitExceeded: async (
    request: NextRequest,
    userId?: string,
    endpoint?: string,
    limit?: number,
  ) => {
    await auditLogger.logRateLimitExceeded(request, userId, endpoint, limit);
  },

  /**
   * Log suspicious activity
   */
  suspiciousActivity: async (
    request: NextRequest,
    userId?: string,
    reason: string,
    details?: Record<string, unknown>,
  ) => {
    await auditLogger.logSuspiciousActivity(request, userId, reason, details);
  },

  /**
   * Log security violation
   */
  securityViolation: async (
    request: NextRequest,
    userId?: string,
    violation: string,
    details?: Record<string, unknown>,
  ) => {
    await auditLogger.logSecurityViolation(request, userId, violation, details);
  },

  /**
   * Log user login
   */
  userLogin: async (
    request: NextRequest,
    userId: string,
    method: string = "email",
  ) => {
    await auditLogger.logLogin(request, userId, method);
  },

  /**
   * Log user logout
   */
  userLogout: async (request: NextRequest, userId: string) => {
    await auditLogger.logLogout(request, userId);
  },

  /**
   * Log admin action
   */
  adminAction: async (
    request: NextRequest,
    adminUserId: string,
    action: string,
    targetType: AuditTargetType,
    targetId?: string,
    details?: Record<string, unknown>,
  ) => {
    await auditLogger.logAdminAction(
      request,
      adminUserId,
      action,
      targetType,
      targetId,
      details,
    );
  },
};
