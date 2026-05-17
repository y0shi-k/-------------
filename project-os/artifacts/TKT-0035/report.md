---
ticket: TKT-0035-ai-recipe-add-entrypoint
status: ready
---

# Report

## 変更目的

AI考案を独立タブではなく、レシピ集の追加アクションへ統合した。

## 変更内容

- Mode B 上部タブを `レシピ集` / `スケジュール` の2タブに変更
- レシピ集上部に `新規レシピ` / `テキストから追加` / `AI考案` の3アクションを配置
- AI考案メニューを追加し、`優先消費レシピ` と `指定食材から` の既存AIフローへ接続
- 期限が近い食材の個別考案導線をAI考案メニュー内へ移動
- `SPEC-0035` / `TKT-0035` を追加

## 実施した確認

- 標準 verify: `VERIFY_PASSED`
- `git diff --check`: pass
- 禁止ダイアログAPIと旧AIトップタブ参照: no matches
- `<script>` 構文チェック: pass

## 残リスク

- Gemini Canvasへの貼り付けプレビューと実通信確認は未実施
