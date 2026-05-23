import { SetupStatus } from "@/components/setup-status";
import { setupSteps } from "@/lib/navigation";

export default function Home() {
  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Stock Master</p>
          <h1 id="page-title">料理と食材管理をWeb版へ移行中</h1>
          <p className="lead">
            この画面はNext.js版の初期土台です。Supabase接続の準備を進めています。
          </p>
        </div>
        <div className="summary-box" aria-label="今回の範囲">
          <span>Scope</span>
          <strong>TKT-0102</strong>
          <p>Supabaseの環境変数と安全な接続clientを用意しています。</p>
        </div>
      </section>

      <SetupStatus steps={setupSteps} />
    </main>
  );
}
