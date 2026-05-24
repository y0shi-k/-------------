import { redirect } from "next/navigation";
import { InventoryBoard } from "@/components/inventory-board";
import { SetupStatus } from "@/components/setup-status";
import { LogoutButton } from "@/components/logout-button";
import type { StockItem } from "@/lib/inventory/types";
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

  const [{ data: stagingItems }, { data: inventoryItems }] = await Promise.all([
    supabase
      .from("staging_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
  ]);

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Stock Master</p>
          <h1 id="page-title">在庫管理のWeb版ホーム</h1>
          <p className="lead">
            {user.email ?? "ログイン中のユーザー"} の登録待ちと在庫だけを扱います。
          </p>
        </div>
        <div className="summary-box" aria-label="今回の範囲">
          <span>Scope</span>
          <strong>TKT-0105</strong>
          <p>手動登録から在庫確定までをSupabaseに保存します。</p>
          <LogoutButton />
        </div>
      </section>

      <InventoryBoard
        initialInventoryItems={(inventoryItems ?? []) as StockItem[]}
        initialStagingItems={(stagingItems ?? []) as StockItem[]}
        userId={user.id}
      />
      <SetupStatus steps={setupSteps} />
    </main>
  );
}
