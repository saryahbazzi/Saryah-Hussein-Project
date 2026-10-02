import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serviceRoleKey, supabaseEnv } from "@/lib/env";

/** Service-role client. Bypasses RLS: use only in trusted server code (webhooks, cron, checkout). */
export function createAdminClient() {
  return createClient(supabaseEnv().url, serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
