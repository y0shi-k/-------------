import { redirect } from "next/navigation";
import { SetupStatus } from "@/components/setup-status";
import { LogoutButton } from "@/components/logout-button";
import { setupSteps } from "@/lib/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Stock Master</p>
          <h1 id="page-title">ログイン済みのWeb版ホーム</h1>
          <p className="lead">
            {user.email ?? "ログイン中のユーザー"} の個人データだけを扱う入口です。
          </p>
        </div>
        <div className="summary-box" aria-label="今回の範囲">
          <span>Scope</span>
          <strong>TKT-0104</strong>
          <p>Supabase Auth と RLS を前提に、自分だけが入れる状態にしています。</p>
          <LogoutButton />
        </div>
      </section>

      <SetupStatus steps={setupSteps} />
    </main>
  );
}
