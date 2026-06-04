---
ticket_id: TKT-0162-web-desktop-home-dashboard
status: passed
review_scope:
  - SPEC-0162-web-desktop-home-dashboard
  - TKT-0162-web-desktop-home-dashboard
---

# Review Record

## checked_diff_paths

- `web/src/components/home-dashboard.tsx`（新規）
- `web/src/components/web-mode-shell.tsx`（home prop・描画分岐・トップバー/ステータス見出し・matchMedia 昇格）
- `web/src/app/page.tsx`（home prop 受け渡し。新規 fetch なし）
- `web/src/app/globals.css`（`.home-dashboard` 系スタイル追加）
- `web/src/__tests__/web-mode-shell.test.tsx`（home テスト2件追加・既存維持）
- `web/src/__tests__/home-dashboard.test.tsx`（新規ユニット）

## checked_artifacts

- `project-os/artifacts/TKT-0162/verify.json`（status=pass）
- `project-os/artifacts/TKT-0162/report.md`
- `project-os/artifacts/TKT-0162/manual-smokes.md`

## subagent_usage

- 計画フェーズで Explore エージェント2体（シェルのナビ構造 / ダッシュボードのデータソース・テスト）を並列実行。
  実装・レビューは本エージェントが直接実施。

## findings

- 危険性レビュー（supabase_schema_change 🔴 への対応）:
  - diff に `create table` / `alter table` / `create policy` / `enable row level security` /
    `storage.buckets` は存在しない。`supabase/` 配下は無変更。
  - 🔴 点灯は `diff_regex_any` 最終代替（`recipes|meal_schedules|cooking_history|photos` 等の語）が
    TypeScript 識別子（`recipes`, `cookingHistoryWithPhotos` 等）へ過剰マッチしたもの。実ロジックは
    既存データの集約表示のみ。→ 実質非危険変更と判定。
- 個人データを持つテーブルのRLS: 変更なし（既存 policy をそのまま利用、新規テーブル/policy 追加なし）。
- 写真Storage: 公開バケット化や新規署名URL経路の追加なし。
- 秘密情報: APIキー・Service Role Key・写真URL を新たにブラウザへ露出する経路は無し（policy `no_hardcoded_secret` pass）。
- 設計: home の描画は既存の settings 分岐と同一パターン（`mode-panel`）。shell をデータ非依存に保つため
  ホームの中身は page.tsx で組み立てて `home` ReactNode として渡しており、childrenByMode と整合。
- immutability / console.log: 新規コードに mutation・console.log なし。

## open_risks

- UI happy-path のブラウザ目視確認はユーザー残課題（report.md「残リスク」と同じ）。
- matchMedia 昇格方式により PC で一瞬 ingredients→home の切替が見え得る（許容、必要なら useLayoutEffect 化）。

## verdict

- pass。schema/RLS/Storage/auth/AI route の実変更は無く、非危険変更として完了可能。
  🔴 点灯は散文由来の過剰マッチであり、静的確認で安全性を担保した。
