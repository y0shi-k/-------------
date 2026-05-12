# TKT-0003-image-scan-registration.md

---
ticket_id: TKT-0003
related_specs:
  - SPEC-0003-image-scan-registration.md
owner_role: ai-implementer
required_evals:
  - ui_component_addition
status: implementation_ready
---

## 目的

レシートや食材パッケージの写真から、GeminiマルチモーダルAPIを使って食材情報を自動抽出し、登録待ち（Staging）リストへ一括投入する機能を実装する。手動入力の負担を減らし、買い物直後の一括登録をスムーズにする。

## タスク

- [x] 画像ファイル選択用の `<input type="file" accept="image/*">` を登録待ちフローに追加
- [x] 選択された画像をBase64エンコードする処理を実装
- [x] Gemini API（マルチモーダル: `generateContent` with inlineData）へ画像＋テキストプロンプトを送信する処理を実装
- [x] AIからのレスポンスをパースし、食材名・数量・単位・期限などを抽出する
- [x] 抽出結果をStagingリストへ一括追加する
- [x] APIキー管理に関するセキュリティ確認（フロントエンド露出のリスク評価）
- [x] verify コマンド実行
- [x] artifacts を `project-os/artifacts/TKT-0003/` に作成

## Acceptance

- ユーザーが画像を選択できるUIが存在する
- 画像から複数の食材が自動抽出され、Stagingリストに追加される
- 抽出結果はユーザーが確認・修正できる（既存のStaging編集フローを流用）
- HTML構文チェックが通る
- `executeGAS` と `GAS_URL` が残っている
- API呼び出し失敗時にエラーメッセージが表示され、フリーズしない

## 補足

- Gemini APIキーは現状 `batchPredictAI` 内で空文字のままである。本機能実装時には、GAS側でプロキシする方式への移行を検討すること。
- 画像のプライバシーに配慮し、不要な個人情報（店舗名・住所・電話番号など）をAI送信時に除去する仕組みが望ましい。
- **保留**: 編集モーダル（`openInventoryEditor`）内で開封日を変更した際の「実質期限自動推測」機能は、別途フェーズ1.5またはPhase2で実装予定。現状は登録待ち（Staging）タブでの `batchPredictAI` のみ対応。
