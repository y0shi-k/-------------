---
ticket_id: TKT-0236-inventory-bulk-delete
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
  - supabase_schema_change
  - auth_and_rls_policy
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui（チケットの required_evals。非危険）
- supabase_schema_change / auth_and_rls_policy の自動マッチは、diff 内の `inventory_items` テーブル名トークン・`user_id` 語の過剰マッチ（チケット owner_notes で予見済み。TKT-0178 と同様）と、並行セッションの認証イニシアチブ（TKT-0228〜0233）の未コミット変更の同居によるもの。本チケットの実変更2ファイルに schema / RLS / auth の変更はない。

## executed_checks

- ユニットテスト（vitest, jsdom）で次を確認:
  - 在庫カード2件を選択→「選択削除」→確認パネル「削除する」で `from("inventory_items")` への `.delete().eq("user_id", ...).in("id", ["item-1","item-2"])` が呼ばれ、「食材を2件削除しました。」が表示される。
  - 確認パネルで「やめる」を押すと delete クエリが呼ばれず、カードが画面に残る。
  - 既存28件のテスト（単体削除・買い物一括削除・選択トグル等）が引き続き green＝既存挙動の非破壊を確認。
- コードレビューで以下を確認:
  - クエリは既存の単体削除・買い物一括削除と同じ `.eq("user_id", userId)` 併用パターン。RLS ポリシー自体への変更なし。
  - `supabase/` 配下・migration・schema に本チケットとしての変更なし。
  - 削除以外の一括操作（アーカイブ等）を追加していない（非ゴール遵守）。

## skipped_checks

- 実機・実DBでの一括削除確認（jsdom＋モックで代替）。**ユーザーの実機スモークで確認する**: 複数選択→選択削除→確認→消滅、キャンセルで非削除。

## open_risks

- undo 無しの物理削除のため、実運用での誤操作リスクは確認パネル＋件数明示に依存する（在庫の単体削除と同水準）。
