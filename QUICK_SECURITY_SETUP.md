# 🚀 Quick Security Setup Guide

## 🎯 **5-Minute Setup**

### **Step 1: Environment Variables**

```bash
# Copy the template
cp .env.example .env.local

# Edit with your Supabase keys
nano .env.local
```

Add your keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NODE_ENV=development
```

### **Step 2: Verify Security**

```bash
# Check environment setup
npm run env:check

# Run security validation
npm run security:check

# Start development server
npm run dev
```

### **Step 3: Database Setup (Supabase Dashboard)**

1. Go to your Supabase project
2. Open SQL Editor
3. Run these scripts in order:

```sql
-- 1. Enable RLS
-- Copy and run: enable-rls.sql

-- 2. Add constraints
-- Copy and run: migrations/comprehensive-database-constraints.sql

-- 3. Create audit logs
-- Copy and run: migrations/create-audit-logs-table.sql
```

### **Step 4: GitHub Secrets (for CI/CD)**

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## ✅ **You're Done!**

Your application now has **enterprise-grade security**:

- 🔐 **No exposed secrets**
- 🛡️ **Input validation**
- 🔑 **Authentication**
- 🚫 **XSS protection**
- ⚡ **Rate limiting**
- 📊 **Audit logging**
- 🔒 **Row Level Security**

## 🧪 **Test Your Security**

```bash
# Run all tests
npm test

# Run security tests
npm test -- __tests__/security.test.ts

# Check for linting issues
npm run lint

# Type check
npm run type-check
```

## 🚨 **If Something Goes Wrong**

### **Environment Issues**

```bash
# Check what's missing
npm run env:check

# Validate security
npm run security:check
```

### **Database Issues**

- Check Supabase connection
- Verify RLS policies are enabled
- Run migration scripts again

### **Build Issues**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📞 **Need Help?**

Check these guides:

- `ENVIRONMENT_SECURITY_GUIDE.md` - Detailed environment setup
- `SECURITY_SETUP_SUMMARY.md` - Complete security overview
- `SECURITY_IMPLEMENTATION_STATUS.md` - Current status

Your polling app is now **production-ready** with bulletproof security! 🎉
