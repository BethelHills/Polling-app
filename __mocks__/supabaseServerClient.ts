/**
 * Supabase Server Client Mock
 * This file provides a mock for the server-side Supabase client used in API routes
 */

import { supabaseServerClient, setupMockAuth, setupMockDatabase, resetSupabaseMocks } from './supabaseClient';

// Re-export the server client mock
export { supabaseServerClient, setupMockAuth, setupMockDatabase, resetSupabaseMocks };

// Default export
export default supabaseServerClient;
