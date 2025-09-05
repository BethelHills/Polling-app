import { createClient } from "@supabase/supabase-js";

// Client-side Supabase configuration
// These variables are safe to expose to the browser
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Client-side Supabase client (for browser use)
// Uses anonymous key with limited permissions
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (for API routes and server components)
// Uses service role key with full database access
// NEVER expose this key to the client!
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
