---
ticket_id: TKT-0167-recipe-favorite-flag
status: ready
---

# Report Draft

## 変更目的

レシピに「お気に入り」を新設した。PCデザイン正本（`docs/design/pc-design-language.md` §3.5/§3.3）に沿って、TKT-0166 で縦型化したレシピカードにハートを載せ、クリックで切替・保存できるようにした。カテゴリ絞り込みに「お気に入り」チップを追加し、選択時はお気に入りのレシピだけを表示する。永続化のため `recipes` テーブルに `is_favorite` 列を新設した（schema 変更を伴う危険変更）。

## 今回追加した安全装置

- **後方互換（二重）**: 列は `boolean not null default false` で追加。既存レシピは自動で false。さらに取得側（`page.tsx`）で `Boolean(recipe.is_favorite)` 正規化し、未定義でも false に倒す。
- **RLS 確認**: 新規ポリシーを足さず、既存の行ポリシー（`auth.uid() = user_id`）で is_favorite の参照・更新が自分の行に限定されることを hosted DB で実確認。更新クエリにも `.eq("user_id", userId)` を明示し二重化。
- **楽観的更新＋失敗ロールバック**: 既存 `moveScheduleToSlot` と同型。先に画面を反転し、保存失敗時は前状態へ戻してレイアウトを動かさないトーストで通知。
- **責務分離**: お気に入りはトグル専用更新にし、既存のレシピ保存（`saveRecipe`）payload に混ぜないことで保存処理の回帰を回避。
- **migration の非破壊性**: `add column if not exists` のみ。`schema_v1.sql` は無改変、追記 migration で進行。

## 実施した確認

- **コード verify**: lint / typecheck / test / build いずれも pass。policy（GAS漏れ・秘密直書き・RLS有無）も pass（`verify.json`）。
- **hosted DB 実検証**（ユーザー承認のうえ `supabase db push`）:
  - 列定義 = boolean / default false / NOT NULL。
  - 既存 6 行が null 0 件・true 0 件（全て default false）。
  - RLS 有効、recipes の 4 ポリシーが全て `auth.uid() = user_id`。
- **付随修正**: Stop hook（`hook_decisions_reminder.py`）が Stop で非対応の `hookSpecificOutput.additionalContext` を出してスキーマエラーになっていたため、`systemMessage` へ修正。
- **UI**: ハートの SVG が当初の非対称パスで崩れたため対称パスへ修正。

## 残リスク

- hosted（実運用）DB へ適用済み。ロールバックには別 migration（`alter table public.recipes drop column is_favorite;`）が必要。
- UI の happy-path（実際のハート保存・リロード保持・絞り込み・オフライン時ロールバック・スマホ表示・ハートの最終見た目）はユーザーのブラウザ確認待ち（`manual-smokes.md` の skipped_checks）。
- このマシンに Docker が無く真のローカル Supabase が使えないため、DB 検証は hosted で実施した（ローカル隔離環境での再現は不可）。

## 次の依頼や人判断

- ブラウザでの UI happy-path 確認（dev サーバは hosted DB に接続）。崩れ・太さ・大きさの微調整が要れば対応する。
- 本番運用としては既に hosted へ適用済みのため追加の `db push` は不要。Vercel デプロイのタイミングは別判断。
