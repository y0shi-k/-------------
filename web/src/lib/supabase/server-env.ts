import "server-only";

import type { RuntimeEnv } from "@/lib/supabase/public-env";

export type ServerSupabaseEnv = {
  url: string;
  serviceRoleKey: string;
};

function requireEnvValue(env: RuntimeEnv, name: string): string {
  const value = env[name];

  if (!value) {
    throw new Error(`${name} is not configured. Set it in web/.env.local or Vercel environment variables.`);
  }

  return value;
}

export function getServerSupabaseEnv(env: RuntimeEnv = process.env): ServerSupabaseEnv {
  return {
    url: requireEnvValue(env, "NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: requireEnvValue(env, "SUPABASE_SERVICE_ROLE_KEY")
  };
}
