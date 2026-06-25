import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Service-role Supabase client — bypasses RLS.
 * Use ONLY for server-side operations that require admin access,
 * such as public token lookups before a user is authenticated.
 * Never expose this client or the service role key to the browser.
 */
export function createAdminClient() {
  if (!isAdminConfigured()) {
    throw new Error(
      "Admin Supabase client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
