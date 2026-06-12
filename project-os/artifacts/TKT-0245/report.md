---
ticket_id: TKT-0245-cross-board-sync-regression-tests
status: ready
---

# Report Draft

## 変更目的

イニシアチブ「在庫データの全画面即時反映」（TKT-0242〜0244 の共有ストア化）の締めとして、クロスボード鮮度バグ（「調理完了後に在庫一覧が古いまま」「在庫追加が献立の自動マッチに出ない」）の再発を自動検出する回帰テストを追加した。

- 追加ファイル: `web/src/__tests__/cross-board-sync.test.tsx`（テストのみ。production コードは一切変更なし）
- チケット front-matter の status 更新のみ `project-os/tickets/` 側に発生

## 今回追加した安全装置

vitest(jsdom) の回帰テスト3シナリオ。共有ストア `inventory-store.tsx` は実物を通し、Supabase クライアントのみモック。

1. **調理完了→在庫減算の同期（実フロー）**: 実物 `RecipeMealWorkspace` を `InventoryStoreProvider` 配下にマウントし、実 UI 操作（スケジュール表示→「調理を開始」→「料理を完了する」→消費モーダル「確定」）で `completeSchedule` を駆動。Supabase モックは可変在庫ストアとして update/select に整合応答を返し、同一 Provider 配下の独立リーダーで玉ねぎ 5→3 の減算反映を検証。消費確定がストアを経由しなくなる回帰、DB update 経路の破壊で必ず落ちる。
2. **在庫追加→献立側の自動マッチ反映**: 実物 `RecipeMealWorkspace` をマウントした状態でストアに在庫を追加し、献立側の在庫参照（自動マッチング入力）が新在庫を認識することを検証。
3. **Provider 初期化フィルタ**: archived_at あり / quantity=0 のアイテムが初期化で除外されることを検証。

実装過程で2回の差し戻しを実施: 初版・2版は合成コンポーネントで `setInventoryItems` を直叩きしており「ボードがストアを経由しなくなる」回帰を検出できなかったため、実コンポーネント駆動に改修させた（消費確定フローの実体は cooking-history-board ではなく recipe-meal-workspace 側にあることを特定）。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0245` → **pass**（lint / typecheck / test / build すべて pass。cross-board-sync 含む全テスト green）
- policy チェック: no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean すべて pass
- ローカル Supabase + Playwright の E2E スモーク（acceptance で任意）は**未実施**。理由: 本チケットの差分はテストファイルのみで production 挙動が変わらず、jsdom テストが消費確定の実フロー（モーダル操作→DB update→ストア更新→別 Consumer 反映）を通しているため。手順は learnings 2026-06-12 に記録済みで、必要時に再現可能。

## 残リスク

- テストはレシピ材料の名称・単位が在庫と完全一致する正常系のみ検証。換算消費・代替在庫・不一致フォールバックは `recipe-meal-workspace.test.tsx` 側の責務。
- check-gates が `supabase_schema_change` / `photo_upload_storage` の危険 eval を検出したが、これは**誤検知**: テスト内のモックがテーブル名（inventory_items 等）や「写真」関連語を含み diff 正規表現にヒットしたため。git diff 上、`supabase/` 配下・schema・Storage・production コードへの変更はゼロ（review.md 参照）。
- ブラウザ実機での「在庫タブ切替で減算表示（リロードなし）」は jsdom では厳密には等価でない。実機で問題が出た場合は E2E スモーク（learnings 手順）を実施する。

## 次の依頼や人判断

- 特になし。CI への Playwright 組み込みは本チケットの非ゴール（必要になったら別チケット）。
