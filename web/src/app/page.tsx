import { redirect } from "next/navigation";
import { CookingHistoryBoard } from "@/components/cooking-history-board";
import { InventoryBoard } from "@/components/inventory-board";
import { SetupStatus } from "@/components/setup-status";
import { LogoutButton } from "@/components/logout-button";
import type { CookingHistoryItem, CookingHistoryPhoto } from "@/lib/cooking-history/types";
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

  const [{ data: stagingItems }, { data: inventoryItems }, { data: cookingHistory }] = await Promise.all([
    supabase
      .from("staging_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("cooking_history")
      .select("*")
      .eq("user_id", user.id)
      .order("cooked_at", { ascending: false })
      .limit(30)
  ]);
  const cookingHistoryRows = (cookingHistory ?? []) as Omit<CookingHistoryItem, "photos">[];
  const historyIds = cookingHistoryRows.map((item) => item.id);
  const { data: historyPhotos } =
    historyIds.length > 0
      ? await supabase
          .from("photos")
          .select("*")
          .eq("user_id", user.id)
          .eq("usage_type", "cooking_history")
          .in("cooking_history_id", historyIds)
          .order("created_at", { ascending: false })
      : { data: [] };
  const signedPhotos = await Promise.all(
    ((historyPhotos ?? []) as CookingHistoryPhoto[]).map(async (photo) => {
      const { data } = await supabase.storage.from(photo.bucket_id).createSignedUrl(photo.storage_path, 60 * 30);
      return { ...photo, signed_url: data?.signedUrl ?? null };
    })
  );
  const cookingHistoryWithPhotos = cookingHistoryRows.map((item) => ({
    ...item,
    photos: signedPhotos.filter((photo) => photo.cooking_history_id === item.id)
  }));

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Stock Master</p>
          <h1 id="page-title">在庫管理のWeb版ホーム</h1>
          <p className="lead">
            {user.email ?? "ログイン中のユーザー"} の登録待ち、在庫、料理履歴だけを扱います。
          </p>
        </div>
        <div className="summary-box" aria-label="今回の範囲">
          <span>Scope</span>
          <strong>TKT-0108</strong>
          <p>料理履歴と完成写真をSupabaseへ保存します。</p>
          <LogoutButton />
        </div>
      </section>

      <CookingHistoryBoard initialHistory={cookingHistoryWithPhotos as CookingHistoryItem[]} userId={user.id} />
      <InventoryBoard
        initialInventoryItems={(inventoryItems ?? []) as StockItem[]}
        initialStagingItems={(stagingItems ?? []) as StockItem[]}
        userId={user.id}
      />
      <SetupStatus steps={setupSteps} />
    </main>
  );
}
