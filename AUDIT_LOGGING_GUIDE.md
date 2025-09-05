# 🔍 Audit Logging Guide

## 🎯 **Overview**

Audit logging is a critical security feature that tracks all important user actions and system events. This comprehensive audit logging system provides detailed trails for security monitoring, incident investigation, and compliance requirements.

## ✅ **What We've Implemented**

### **1. 🗄️ Database Schema**

#### **`audit_logs` Table Structure:**

```sql
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'poll', 'vote', 'user', 'system'
    target_id UUID, -- ID of the target resource
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100), -- For correlating with request logs
    metadata JSONB, -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

#### **Key Features:**

- **Comprehensive Indexing**: Optimized for common query patterns
- **Row Level Security**: Proper access controls
- **Immutable Logs**: No updates or deletes allowed
- **Automatic Cleanup**: Function to remove old logs

### **2. 🛡️ Audit Logger Utility**

#### **Core Components:**

- **`lib/audit-logger.ts`**: Comprehensive audit logging utility
- **Singleton Pattern**: Ensures consistent logging across the application
- **Type Safety**: Strongly typed audit actions and target types
- **Error Resilience**: Logging failures don't break main functionality

#### **Audit Action Types:**

```typescript
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
```

### **3. 🚀 Integration Points**

#### **✅ Poll Creation API**

```typescript
// Log poll creation for audit trail
try {
  await auditLog.pollCreated(request, userData.user.id, poll.id, title);
} catch (auditError) {
  console.error("Failed to log poll creation audit event:", auditError);
  // Don't fail the request if audit logging fails
}
```

#### **✅ Vote API**

```typescript
// Log vote for audit trail
try {
  await auditLog.vote(request, userId, pollId, option.text, false);
} catch (auditError) {
  console.error("Failed to log vote audit event:", auditError);
  // Don't fail the request if audit logging fails
}
```

#### **✅ Rate Limiting**

```typescript
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
```

## 🎯 **Usage Patterns**

### **✅ 1. Basic Audit Logging**

```typescript
import { auditLog } from "@/lib/audit-logger";

// Log poll creation
await auditLog.pollCreated(request, userId, pollId, pollTitle);

// Log vote
await auditLog.vote(request, userId, pollId, option, isChange);

// Log rate limit exceeded
await auditLog.rateLimitExceeded(request, userId, endpoint, limit);
```

### **✅ 2. Custom Audit Logging**

```typescript
import { auditLogger, AuditAction, AuditTargetType } from "@/lib/audit-logger";

// Log custom action
await auditLogger.log({
  user_id: userId,
  action: AuditAction.ADMIN_ACTION,
  target_type: AuditTargetType.USER,
  target_id: targetUserId,
  metadata: {
    admin_action: "ban_user",
    reason: "spam_behavior",
    duration: "7_days",
  },
});
```

### **✅ 3. Request Context Logging**

```typescript
// Log with automatic request context extraction
await auditLogger.logWithRequest(request, {
  user_id: userId,
  action: AuditAction.UPDATE_POLL,
  target_type: AuditTargetType.POLL,
  target_id: pollId,
  metadata: {
    changes: { title: "Old Title", description: "New Description" },
  },
});
```

### **✅ 4. Security Event Logging**

```typescript
// Log suspicious activity
await auditLog.suspiciousActivity(
  request,
  userId,
  "Multiple failed login attempts",
  { attempts: 5, time_window: "5_minutes" },
);

// Log security violation
await auditLog.securityViolation(
  request,
  userId,
  "Unauthorized access attempt",
  { resource: "admin_panel", method: "GET" },
);
```

## 🛡️ **Security Features**

### **✅ 1. Row Level Security (RLS)**

```sql
-- Only authenticated users can insert audit logs
CREATE POLICY "insert_audit_logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only system admins can read audit logs
CREATE POLICY "select_audit_logs_admin" ON audit_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Users can read their own audit logs
CREATE POLICY "select_audit_logs_own" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

-- No updates or deletes allowed (audit logs should be immutable)
CREATE POLICY "no_update_audit_logs" ON audit_logs
    FOR UPDATE USING (false);

CREATE POLICY "no_delete_audit_logs" ON audit_logs
    FOR DELETE USING (false);
```

### **✅ 2. Data Privacy**

- **IP Address Logging**: Tracks IP addresses for security analysis
- **User Agent Logging**: Records browser/client information
- **Request Correlation**: Links audit logs to specific requests
- **Metadata Storage**: Flexible JSON storage for additional context

### **✅ 3. Immutable Logs**

- **No Updates**: Audit logs cannot be modified after creation
- **No Deletes**: Audit logs cannot be deleted (except by cleanup function)
- **Timestamp Integrity**: All logs have accurate timestamps
- **Data Integrity**: Foreign key constraints ensure data consistency

## 📊 **Querying Audit Logs**

### **✅ 1. User Activity Tracking**

```sql
-- Get all actions by a specific user
SELECT action, target_type, target_id, created_at, metadata
FROM audit_logs
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;

-- Get user's poll creation history
SELECT action, target_id, created_at, metadata->>'poll_title' as poll_title
FROM audit_logs
WHERE user_id = 'user-uuid-here'
  AND action = 'create_poll'
ORDER BY created_at DESC;
```

### **✅ 2. Security Monitoring**

```sql
-- Find rate limit violations
SELECT user_id, ip_address, created_at, metadata
FROM audit_logs
WHERE action = 'rate_limit_exceeded'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Find suspicious activity
SELECT user_id, ip_address, created_at, metadata
FROM audit_logs
WHERE action = 'suspicious_activity'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### **✅ 3. Poll Activity Analysis**

```sql
-- Get all activity for a specific poll
SELECT action, user_id, created_at, metadata
FROM audit_logs
WHERE target_type = 'poll'
  AND target_id = 'poll-uuid-here'
ORDER BY created_at DESC;

-- Get voting patterns
SELECT
  DATE(created_at) as date,
  COUNT(*) as vote_count
FROM audit_logs
WHERE action = 'vote'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### **✅ 4. IP Address Analysis**

```sql
-- Find actions from specific IP
SELECT action, user_id, created_at, metadata
FROM audit_logs
WHERE ip_address = '192.168.1.100'
ORDER BY created_at DESC;

-- Find multiple users from same IP
SELECT
  ip_address,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_actions
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(DISTINCT user_id) > 1
ORDER BY total_actions DESC;
```

## 🔧 **Maintenance and Cleanup**

### **✅ 1. Automatic Cleanup Function**

```sql
-- Clean up old audit logs (older than 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '1 year';

    -- Log the cleanup action
    INSERT INTO audit_logs (action, target_type, metadata, created_at)
    VALUES (
        'cleanup_audit_logs',
        'system',
        jsonb_build_object(
            'deleted_count', ROW_COUNT,
            'cleanup_date', NOW()
        ),
        NOW()
    );
END;
$$ LANGUAGE plpgsql;
```

### **✅ 2. Scheduled Cleanup**

```sql
-- Schedule cleanup to run weekly (if using pg_cron extension)
SELECT cron.schedule('cleanup-audit-logs', '0 2 * * 0', 'SELECT cleanup_old_audit_logs();');
```

### **✅ 3. Manual Cleanup**

```sql
-- Manual cleanup of old logs
SELECT cleanup_old_audit_logs();

-- Check audit log table size
SELECT
  pg_size_pretty(pg_total_relation_size('audit_logs')) as table_size,
  COUNT(*) as total_logs,
  MIN(created_at) as oldest_log,
  MAX(created_at) as newest_log
FROM audit_logs;
```

## 🚨 **Incident Investigation**

### **✅ 1. Security Incident Response**

```sql
-- Investigate suspicious user activity
SELECT
  action,
  target_type,
  target_id,
  ip_address,
  user_agent,
  created_at,
  metadata
FROM audit_logs
WHERE user_id = 'suspicious-user-uuid'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Find all actions from suspicious IP
SELECT
  user_id,
  action,
  target_type,
  created_at,
  metadata
FROM audit_logs
WHERE ip_address = 'suspicious-ip-address'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### **✅ 2. Data Breach Investigation**

```sql
-- Track all access to specific poll
SELECT
  user_id,
  action,
  ip_address,
  created_at,
  metadata
FROM audit_logs
WHERE target_type = 'poll'
  AND target_id = 'compromised-poll-uuid'
ORDER BY created_at DESC;

-- Find unauthorized access attempts
SELECT
  user_id,
  action,
  ip_address,
  created_at,
  metadata
FROM audit_logs
WHERE action IN ('security_violation', 'suspicious_activity')
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### **✅ 3. User Behavior Analysis**

```sql
-- Analyze user voting patterns
SELECT
  user_id,
  COUNT(*) as total_votes,
  COUNT(DISTINCT target_id) as unique_polls,
  MIN(created_at) as first_vote,
  MAX(created_at) as last_vote
FROM audit_logs
WHERE action = 'vote'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY total_votes DESC;

-- Find users with unusual activity patterns
SELECT
  user_id,
  COUNT(*) as total_actions,
  COUNT(DISTINCT action) as unique_actions,
  COUNT(DISTINCT ip_address) as unique_ips
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id
HAVING COUNT(DISTINCT ip_address) > 3
ORDER BY total_actions DESC;
```

## 📈 **Analytics and Reporting**

### **✅ 1. Activity Metrics**

```sql
-- Daily activity summary
SELECT
  DATE(created_at) as date,
  action,
  COUNT(*) as count
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), action
ORDER BY date DESC, count DESC;

-- Top users by activity
SELECT
  user_id,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN action = 'create_poll' THEN 1 END) as polls_created,
  COUNT(CASE WHEN action = 'vote' THEN 1 END) as votes_cast
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY total_actions DESC
LIMIT 20;
```

### **✅ 2. Security Metrics**

```sql
-- Rate limit violations by endpoint
SELECT
  metadata->>'endpoint' as endpoint,
  COUNT(*) as violations,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM audit_logs
WHERE action = 'rate_limit_exceeded'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY metadata->>'endpoint'
ORDER BY violations DESC;

-- Security events summary
SELECT
  action,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM audit_logs
WHERE action IN ('rate_limit_exceeded', 'suspicious_activity', 'security_violation')
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY count DESC;
```

## 🎯 **Best Practices**

### **✅ 1. Logging Strategy**

- **Log Early**: Log at the beginning of critical operations
- **Log Context**: Include relevant metadata for investigation
- **Log Consistently**: Use standardized action names and target types
- **Log Securely**: Ensure audit logs are tamper-proof

### **✅ 2. Performance Considerations**

- **Async Logging**: Don't block main operations for logging
- **Batch Operations**: Consider batching multiple log entries
- **Index Optimization**: Ensure proper indexing for common queries
- **Cleanup Strategy**: Regular cleanup to maintain performance

### **✅ 3. Privacy and Compliance**

- **Data Retention**: Implement appropriate retention policies
- **Access Controls**: Restrict access to audit logs
- **Data Anonymization**: Consider anonymizing old logs
- **Compliance**: Ensure logging meets regulatory requirements

## 🚀 **Next Steps**

1. **Set Up Monitoring**: Create alerts for suspicious activity patterns
2. **Implement Analytics**: Build dashboards for audit log analysis
3. **Add More Events**: Extend logging to cover additional user actions
4. **Automate Cleanup**: Set up scheduled cleanup processes
5. **Create Reports**: Build automated security and activity reports

Your polling application now has **enterprise-grade audit logging** that provides comprehensive security monitoring and incident investigation capabilities! 🔍✨
