# 🔐 Environment Variable Security Guide

## 🎯 **Overview**

This guide covers proper environment variable management for the polling application, ensuring that sensitive keys like service role keys are never exposed to the client or committed to the repository.

## ✅ **Key Principles**

### **1. 🛡️ Client vs Server Key Separation**

#### **Client-Side Keys (Safe to Expose)**

- **`NEXT_PUBLIC_SUPABASE_URL`**: Public Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Anonymous key with limited permissions

#### **Server-Side Keys (Never Expose)**

- **`SUPABASE_SERVICE_ROLE_KEY`**: Service role key with full database access
- **`SUPABASE_SECRET_KEY`**: Legacy name for service role key (deprecated)

### **2. 🚫 What NOT to Do**

```bash
# ❌ NEVER do this - exposes service role key to client
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=sk-...

# ❌ NEVER commit secrets to repository
SUPABASE_SERVICE_ROLE_KEY=sk-... # in .env files

# ❌ NEVER use service role key in client-side code
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)
```

### **3. ✅ What TO Do**

```bash
# ✅ Use anonymous key for client-side
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# ✅ Use service role key only server-side
SUPABASE_SERVICE_ROLE_KEY=sk-... # in .env.local or GitHub Secrets

# ✅ Proper client-side usage
const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

## 🏗️ **Project Structure**

### **Environment Files**

```
polling-app/
├── .env.example          # Template with placeholder values
├── .env.local           # Local development (gitignored)
├── .gitignore           # Ensures .env.local is ignored
└── .github/workflows/   # CI/CD with GitHub Secrets
```

### **Supabase Client Configuration**

#### **Client-Side (`lib/supabase.ts`)**

```typescript
// Safe for browser exposure
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### **Server-Side (`lib/supabaseServerClient.ts`)**

```typescript
// Server-only, never exposed to client
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseServerClient = createClient(url, supabaseServiceKey);
```

## 🔧 **Setup Instructions**

### **1. Local Development Setup**

#### **Step 1: Create Environment File**

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your actual values
nano .env.local
```

#### **Step 2: Add Your Keys**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=sk-...
NODE_ENV=development
```

#### **Step 3: Verify .gitignore**

```bash
# .gitignore should include:
.env.local
.env*.local
```

### **2. GitHub Secrets Setup**

#### **Step 1: Go to Repository Settings**

1. Navigate to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**

#### **Step 2: Add Required Secrets**

```bash
# Required secrets for CI/CD
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=sk-...

# Optional deployment secrets
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

#### **Step 3: Environment-Specific Secrets**

```bash
# For different environments, use prefixes:
# Development
DEV_NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
DEV_SUPABASE_SERVICE_ROLE_KEY=sk-...

# Staging
STAGING_NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
STAGING_SUPABASE_SERVICE_ROLE_KEY=sk-...

# Production
PROD_NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
PROD_SUPABASE_SERVICE_ROLE_KEY=sk-...
```

## 🚀 **CI/CD Configuration**

### **GitHub Actions Workflow**

The CI/CD pipeline is configured to use secrets appropriately:

#### **Client-Side Jobs (No Service Role Key)**

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - name: Run tests
      run: npm test
      env:
        # Only public keys for client-side testing
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

#### **Server-Side Jobs (Service Role Key Required)**

```yaml
database-migration:
  runs-on: ubuntu-latest
  steps:
    - name: Run database migrations
      run: npm run migrate
      env:
        # All environment variables including service role key
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### **Security Checks**

The CI pipeline includes security checks:

```yaml
security-audit:
  steps:
    - name: Check for exposed secrets
      run: |
        # Check for potential secret exposure in code
        if grep -r "SUPABASE_SERVICE_ROLE_KEY" --exclude-dir=node_modules --exclude-dir=.git .; then
          echo "❌ Service role key found in code!"
          exit 1
        fi

        if grep -r "sk-" --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" .; then
          echo "❌ Potential Supabase secret key found in code!"
          exit 1
        fi
```

## 🔍 **Key Usage Patterns**

### **1. Client-Side Operations**

```typescript
// ✅ Correct - uses anonymous key
import { supabase } from "@/lib/supabase";

// User authentication
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password",
});

// Public data access (with RLS)
const { data: polls } = await supabase
  .from("polls")
  .select("*")
  .eq("is_active", true);
```

### **2. Server-Side Operations**

```typescript
// ✅ Correct - uses service role key
import { supabaseServerClient } from "@/lib/supabaseServerClient";

// Admin operations
const { data, error } = await supabaseServerClient
  .from("polls")
  .insert({ title: "New Poll", owner_id: userId });

// JWT token validation
const { data: userData } = await supabaseServerClient.auth.getUser(token);
```

### **3. API Route Example**

```typescript
// app/api/polls/route.ts
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function POST(request: NextRequest) {
  // ✅ Server-side only - service role key available
  const { data, error } = await supabaseServerClient
    .from("polls")
    .insert(pollData);

  return NextResponse.json({ data, error });
}
```

## 🛡️ **Security Best Practices**

### **1. Environment Variable Validation**

```typescript
// lib/env-validation.ts
export function validateEnvironment() {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const requiredServer = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // Validate client-side variables
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.includes("placeholder")) {
      throw new Error(`Missing or invalid environment variable: ${key}`);
    }
  }

  // Validate server-side variables (only on server)
  if (typeof window === "undefined") {
    for (const [key, value] of Object.entries(requiredServer)) {
      if (!value || value.includes("placeholder")) {
        throw new Error(
          `Missing or invalid server environment variable: ${key}`,
        );
      }
    }
  }
}
```

### **2. Runtime Security Checks**

```typescript
// lib/security-checks.ts
export function checkForExposedSecrets() {
  // Check if service role key is accidentally exposed to client
  if (typeof window !== "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("🚨 SECURITY WARNING: Service role key exposed to client!");
    throw new Error("Service role key must not be exposed to client-side code");
  }
}
```

### **3. Key Rotation Strategy**

```bash
# 1. Generate new keys in Supabase dashboard
# 2. Update GitHub Secrets
# 3. Update local .env.local
# 4. Deploy with new keys
# 5. Verify application works
# 6. Revoke old keys in Supabase dashboard
```

## 🚨 **Security Incident Response**

### **If Service Role Key is Exposed:**

1. **Immediate Actions:**

   ```bash
   # 1. Revoke the exposed key in Supabase dashboard
   # 2. Generate a new service role key
   # 3. Update all environment variables
   # 4. Deploy immediately
   ```

2. **Investigation:**

   ```bash
   # Check git history for exposed keys
   git log --all --full-history -- .env*

   # Check for keys in code
   grep -r "sk-" --exclude-dir=node_modules .
   ```

3. **Prevention:**

   ```bash
   # Add pre-commit hooks
   npm install --save-dev husky lint-staged

   # Add to package.json
   "husky": {
     "hooks": {
       "pre-commit": "lint-staged"
     }
   }
   ```

## 📋 **Checklist**

### **Development Setup**

- [ ] `.env.local` created with proper keys
- [ ] `.env.local` added to `.gitignore`
- [ ] Using anonymous key for client-side operations
- [ ] Using service role key only for server-side operations
- [ ] No secrets committed to repository

### **CI/CD Setup**

- [ ] GitHub Secrets configured
- [ ] CI pipeline uses secrets appropriately
- [ ] Security checks in place
- [ ] Different keys for different environments

### **Production Deployment**

- [ ] Production secrets configured
- [ ] Service role key not exposed to client
- [ ] Environment variables validated
- [ ] Security monitoring in place

## 🎯 **Summary**

### **✅ Do:**

- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side operations
- Use `SUPABASE_SERVICE_ROLE_KEY` only for server-side operations
- Store secrets in GitHub Secrets for CI/CD
- Use `.env.local` for local development
- Keep `.env.local` in `.gitignore`
- Validate environment variables at runtime

### **❌ Don't:**

- Never commit service role keys to repository
- Never expose service role keys to client-side code
- Never use `NEXT_PUBLIC_` prefix for sensitive keys
- Never hardcode keys in source code
- Never share keys in chat/email/documentation

Your polling application now has **enterprise-grade environment variable security** that protects sensitive keys while maintaining proper functionality! 🔐✨
