---
id: SPEC-0076-ai-processing-cancel
title: AI待ち処理の即時キャンセル
status: ready
scope:
  - Gemini API を直接 fetch している AI 待ち処理
  - 共通 processingOverlay のキャンセルUI
constraints:
  - GAS通信、Spreadsheetスキーマ、pendingSync、syncPendingChanges は変更しない
  - 非AIの画像エンコード・画像処理・GAS通信中表示にはキャンセルを追加しない
acceptance:
  - AI待ち overlay にキャンセルボタンが表示される
  - キャンセル押下で fetch が abort され、overlay と disabled 状態が即解除される
  - キャンセル後に遅延レスポンスが返ってもローカル状態へ反映されない
  - batchCompleteFlow のAI解析キャンセル後に在庫登録が続行されない
related_tickets:
  - TKT-0076-ai-processing-cancel
---

# Summary

AI解析・AI相談・AIレシピ生成・画像AI解析の待ち時間中に、ユーザーが共通 overlay から即時キャンセルできるようにする。

## 仕様

- `setStatus(true, label, { cancelable: true })` の時だけ overlay 内に「キャンセル」ボタンを表示する。
- AI処理ごとに `AbortController` と request id を発行する。
- キャンセル時は `abort()`、overlay非表示、フォーム操作可能化、toast表示を行う。
- AIレスポンス反映前に request id を確認し、現在のAI処理でない結果は破棄する。
- `AbortError` は通常のエラーtoastを出さず、キャンセルtoastのみとする。

## 非対象

- GASフォーム送信とポーリング方式のキャンセル
- 画像ファイルのローカルエンコード・リサイズ処理のキャンセル
- 既存モーダルの背景クリック/閉じるポリシー変更
