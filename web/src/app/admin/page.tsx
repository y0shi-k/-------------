import { redirect } from "next/navigation";
import { AdminUserBoard } from "@/components/admin-user-board";
import { fetchAccountRole } from "@/lib/auth/account-status";
import type { AdminProfile } from "@/lib/auth/admin-profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // 未ログインは /login（middleware も遮断するが page でも明示ガード）。
  if (!user) {
    redirect("/login");
  }

  // 権限判定はサーバー側で profiles.role を読む。非 admin は本体へ離脱させる。
  const role = await fetchAccountRole(supabase, user.id);
  if (role !== "admin") {
    redirect("/");
  }

  // admin セッションは RLS（is_admin()）で profiles 全行 select 可（TKT-0228）。
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,email,status,role,approved_at,created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="app-shell admin-shell">
      <AdminUserBoard currentUserId={user.id} initialProfiles={(profiles ?? []) as AdminProfile[]} />
    </main>
  );
}
