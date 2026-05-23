export type RuntimeEnv = Record<string, string | undefined>;

export type PublicSupabaseEnv = {
  url: string;
  anonKey: string;
};

function requireEnvValue(env: RuntimeEnv, name: string): string {
  const value = env[name];

  if (!value) {
    throw new Error(`${name} is not configured. Set it in web/.env.local.`);
  }

  return value;
}

export function getPublicSupabaseEnv(env?: RuntimeEnv): PublicSupabaseEnv {
  const runtimeEnv = env ?? {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };

  return {
    url: requireEnvValue(runtimeEnv, "NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requireEnvValue(runtimeEnv, "NEXT_PUBLIC_SUPABASE_ANON_KEY")
  };
}
