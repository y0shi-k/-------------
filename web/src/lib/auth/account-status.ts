import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthState } from "@/lib/auth/routing";

export type AccountStatus = "pending" | "approved" | "disabled";
export type AccountRole = "member" | "admin";

function normalizeStatus(value: unknown): AccountStatus {
  if (value === "approved" || value === "disabled") {
    return value;
  }
  // 未知値・null は安全側（pending）に倒す。
  return "pending";
}

function normalizeRole(value: unknown): AccountRole {
  // admin 判定は明示的に "admin" の場合のみ。未知値・null は安全側（member）に倒す。
  return value === "admin" ? "admin" : "member";
}

// ログイン済みユーザーのロールを profiles から1クエリで取得する。
// RLS で本人行のみ select 可（TKT-0228）。行なし・取得エラーは安全側で member を返す。
export async function fetchAccountRole(supabase: SupabaseClient, userId: string): Promise<AccountRole> {
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();

  if (error || !data) {
    return "member";
  }

  return normalizeRole(data.role);
}

// ログイン済みユーザーの承認状態を profiles から1クエリで取得する。
// RLS で本人行のみ select 可（TKT-0228）。行なし・取得エラーは安全側で pending を返す。
export async function fetchAccountStatus(supabase: SupabaseClient, userId: string): Promise<AccountStatus> {
  const { data, error } = await supabase.from("profiles").select("status").eq("id", userId).maybeSingle();

  if (error || !data) {
    return "pending";
  }

  return normalizeStatus(data.status);
}

// getUser の結果（user 有無）と承認状態から、ルーティング判定用の AuthState を作る。
export async function resolveAuthState(
  supabase: SupabaseClient,
  userId: string | undefined | null
): Promise<AuthState> {
  if (!userId) {
    return "unauthenticated";
  }

  return fetchAccountStatus(supabase, userId);
}
