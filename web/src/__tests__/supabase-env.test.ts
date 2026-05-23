import { describe, expect, it, vi } from "vitest";
import { getPublicSupabaseEnv } from "@/lib/supabase/public-env";
import { getServerSupabaseEnv } from "@/lib/supabase/server-env";

vi.mock("server-only", () => ({}));

describe("Supabase environment separation", () => {
  it("uses only public Supabase values for the browser client", () => {
    const env = getPublicSupabaseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret"
    });

    expect(env).toEqual({
      url: "https://example.supabase.co",
      anonKey: "anon-key"
    });
  });

  it("keeps the service role key in the server-only environment helper", () => {
    const env = getServerSupabaseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret"
    });

    expect(env).toEqual({
      url: "https://example.supabase.co",
      serviceRoleKey: "server-secret"
    });
  });

  it("fails clearly when public values are missing", () => {
    expect(() => getPublicSupabaseEnv({})).toThrow("NEXT_PUBLIC_SUPABASE_URL is not configured");
  });
});
