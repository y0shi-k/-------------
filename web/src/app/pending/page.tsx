import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { fetchAccountStatus } from "@/lib/auth/account-status";
import { getPendingContent } from "@/lib/auth/pending-content";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function PendingPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // 未ログインの直アクセスは middleware が遮断するが、page 側でも明示ガードする。
  if (!user) {
    redirect("/login");
  }

  // 承認済みが /pending を直叩きした場合は本体へ離脱させる（middleware と同挙動）。
  const status = await fetchAccountStatus(supabase, user.id);
  if (status === "approved") {
    redirect("/");
  }

  const content = getPendingContent(status);

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="pending-title">
        <p className="eyebrow">Stock Master</p>
        <h1 id="pending-title">{content.title}</h1>
        <p className="lead">{content.lead}</p>
        <LogoutButton />
      </section>
    </main>
  );
}
