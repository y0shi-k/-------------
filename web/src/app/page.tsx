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
            この画面はNext.js版の初期土台です。Supabase接続やログインは次のチケットで追加します。
          </p>
        </div>
        <div className="summary-box" aria-label="今回の範囲">
          <span>Scope</span>
          <strong>TKT-0101</strong>
          <p>UIの土台、検証コマンド、環境変数の見本だけを用意しています。</p>
        </div>
      </section>

      <SetupStatus steps={setupSteps} />
    </main>
  );
}
