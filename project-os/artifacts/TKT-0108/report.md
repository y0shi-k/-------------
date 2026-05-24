---
ticket_id: TKT-0108-cooking-history-photo-web
status: ready
---

# TKT-0108 実装報告

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

Web版で、料理履歴と完成写真を記録・閲覧できるようにした。

## 実装したこと

- ホーム画面に「料理履歴」パネルを追加した。
- 料理名、調理日時、メモ、評価を入力して `cooking_history` に保存できるようにした。
- 写真なしの履歴保存に対応した。
- 完成写真をブラウザ側で圧縮し、非公開Supabase Storageへ保存できるようにした。
- 完成写真のメタ情報を `photos` に保存し、`cooking_history_id` で履歴に紐づけた。
- 写真表示は公開URLではなく、短時間の署名付きURLを使うようにした。
- 写真保存に失敗しても、料理履歴本文は画面に残るようにした。

## 今回追加した安全装置

- Storageパスを `userId/cooking-history/...jpg` にして本人データ境界を維持した。
- `usage_type = "cooking_history"` を使い、食材スキャン写真と用途を分けた。
- APIキー、Supabase秘密鍵、写真URLの実値は追加していない。
- Web版にGAS、Spreadsheet、Drive依存は追加していない。

## 実施した確認

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed、31件
- `npm run build`: passed
- ローカルサーバー起動確認: `/` は未ログイン時 `/login` へリダイレクト、`/login` は `200 OK`
- Web版ポリシーチェック: GAS/Spreadsheet/Drive依存なし、秘密値の実値追加なし

## 残リスク

- 実ユーザーでログインした状態のSupabase実アップロード確認は未実施。
- iPhone Safari / Android Chromeでのカメラ起動確認は未実施。
- 署名付きURLは30分で失効するため、長時間開いた画面では再読み込みが必要。

## 次

- 実機でログイン後、写真付き/写真なしの料理履歴保存を確認する。
- 問題なければ `TKT-0109-recipes-and-meal-schedule-web` へ進む。
