"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/supabase/public-env";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getPublicSupabaseEnv();

  return createBrowserClient(url, anonKey);
}
