---
ticket_id: TKT-0004
status: passed
target_evals:
  - ui_component_addition
  - gas_pattern_change
---

# Manual Smokes for TKT-0004

## executed_checks

- [x] HTML構文チェック: `python3 -c "import html.parser; ..."` → VERIFY_PASSED
- [x] `executeGAS` 関数が残存していることを確認
- [x] `GAS_URL` 定数が残存していることを確認
- [x] `alert` / `confirm` / `prompt` が残存していないことを確認
- [x] `showToast` 関数が存在することを確認
- [x] `GEMINI_API_KEY` の空チェックバリデーションがないことを確認
- [ ] **Canvas実機テスト**: Gemini Canvasに `app.html` を貼り付け、起動後にスプレッドシートの5シート全てにヘッダーが入ることを確認
- [ ] **Canvas実機テスト**: モードB「献立・レシピ」に切り替え、サブタブ（レシピ集/AI考案/献立スケジュール）が表示されることを確認
- [ ] **Canvas実機テスト**: 「新規レシピ」ボタンでモーダルが開き、材料・手順の動的追加ができることを確認
- [ ] **Canvas実機テスト**: レシピ保存後、一覧に反映されることを確認
- [ ] **Canvas実機テスト**: レシピ編集・削除が正常に動作することを確認
- [ ] **Canvas実機テスト**: 「テキストから追加」でAI構造化フローが動作することを確認（APIキー不要、空文字のまま空チェックなし）

## skipped_checks

- なし（上記の未チェック項目はユーザーによる実機テスト待ち）

## open_risks

- **既存スプレッドシート（Phase1作成済み）の場合**: `レシピ集`・`献立スケジュール`・`料理履歴` シートにヘッダーがない可能性あり。各GASペイロード内にガードを入れたが、実機で動作確認が必要。
- **レシピ名の重複**: 現時点では同名レシピの重複を防ぐバリデーションは入っていない。
