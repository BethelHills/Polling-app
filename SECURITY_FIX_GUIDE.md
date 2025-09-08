# 🚨 CRITICAL SECURITY FIX REQUIRED

## ❌ **DANGEROUS CODE PATTERN DETECTED**

```typescript
// ❌ NEVER DO THIS - EXPOSES SERVICE ROLE KEY TO CLIENT!
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE!; // ❌ WRONG!

export const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { persistSession: false },
});
```

## ✅ **CORRECT SECURE PATTERNS**

### **1. For Client-Side Operations (Browser)**

```typescript
// ✅ CORRECT - Uses anonymous key (safe for client)
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // ✅ CORRECT!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true }, // ✅ Allow session persistence for client
});
```

### **2. For Server-Side Operations (API Routes, Server Components)**

```typescript
// ✅ CORRECT - Uses service role key (server-only)
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // ✅ CORRECT!

export const supabaseServerClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
```

## 🔧 **IMMEDIATE FIXES NEEDED**

### **1. Fix Environment Variable Name**

```bash
# ❌ Wrong
SUPABASE_SERVICE_ROLE=your-service-role-key-here

# ✅ Correct
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### **2. Use Existing Secure Clients**

Instead of creating new clients, use the existing secure ones:

```typescript
// For client-side operations
import { supabase } from "@/lib/supabase";

// For server-side operations
import { supabaseServerClient } from "@/lib/supabaseServerClient";
```

### **3. Check Your Usage Context**

#### **If this is for a React Component:**

```typescript
// ✅ Use client-side client
import { supabase } from "@/lib/supabase";

export default function MyComponent() {
  const handleVote = async () => {
    const { data, error } = await supabase
      .from("votes")
      .insert({ poll_id, option_id });
  };
}
```

#### **If this is for an API Route:**

```typescript
// ✅ Use server-side client
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function POST(request: NextRequest) {
  const { data, error } = await supabaseServerClient
    .from("polls")
    .insert(pollData);
}
```

## 🛡️ **SECURITY VALIDATION**

Run these commands to check your security:

```bash
# Check environment variables
npm run env:check

# Validate security
npm run security:check

# Check for exposed secrets
grep -r "SUPABASE_SERVICE_ROLE" --exclude-dir=node_modules .
```

## 🚨 **IF YOU'VE ALREADY COMMITTED THIS**

1. **Immediately revoke the exposed key** in Supabase dashboard
2. **Generate a new service role key**
3. **Update all environment variables**
4. **Remove the dangerous code**
5. **Use the secure patterns above**

## 📋 **QUICK CHECKLIST**

- [ ] ❌ Remove `SUPABASE_SERVICE_ROLE` environment variable
- [ ] ✅ Use `SUPABASE_SERVICE_ROLE_KEY` instead
- [ ] ✅ Use `supabase` client for client-side operations
- [ ] ✅ Use `supabaseServerClient` for server-side operations
- [ ] ✅ Never expose service role keys to client-side code
- [ ] ✅ Run security validation: `npm run security:check`
