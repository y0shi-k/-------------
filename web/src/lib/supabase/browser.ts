"use client";

import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/supabase/public-env";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getPublicSupabaseEnv();

  return createClient(url, anonKey);
}
