---
ticket: TKT-0035-ai-recipe-add-entrypoint
status: limited
---

# Manual Smokes

## 実施済み

- 標準 verify が `VERIFY_PASSED` になることを確認
- `git diff --check` で空白エラーなしを確認
- `alert(` / `confirm(` / `prompt(` が残っていないことを確認
- `data-tab="ai"` / `switchBTab('ai')` / `currentBTab === 'ai'` / `renderAiTab(` が残っていないことを確認
- `<script>` 抽出後の `node --check` が成功することを確認

## 未実施

- Gemini Canvas への貼り付けプレビュー
- 実Gemini API呼び出しとGAS通信の手動確認

## メモ

今回の変更はMode BのUI導線整理に限定し、AI生成・保存・同期キューの既存ロジックは再利用している。
