---
ticket_id: TKT-0109-recipes-and-meal-schedule-web
status: ready
---

# TKT-0109 実装報告

## 変更目的

Web版で、レシピ、献立、買い物、調理完了の主要ワークフローを使えるようにした。

## 実装したこと

- ホーム画面に「レシピ・献立・買い物」セクションを追加した。
- レシピ一覧、詳細表示、作成、編集に対応した。
- レシピ材料を `recipe_ingredients` に保存するようにした。
- 日付と食事区分を選び、レシピを `meal_schedules` へ配置できるようにした。
- 献立から不足食材を計算し、選択したものを `shopping_items` に追加できるようにした。
- 献立の調理完了時に `meal_schedules` を完了へ更新し、`cooking_history` へ記録するようにした。
- スマホでは縦積み、タブレット以上では複数カラムで見比べやすい表示にした。

## 今回追加した安全装置

- すべての保存処理に `user_id` を含め、本人データ境界を維持した。
- Web版にGAS、Spreadsheet、Drive依存を追加していない。
- APIキー、Supabase秘密鍵、写真URLの実値は追加していない。
- 新しい外部依存関係は追加していない。

## 実施した確認

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed、38件
- `npm run build`: passed
- Web版ポリシーチェック: GAS/Spreadsheet/Drive依存なし、秘密値の実値追加なし

## 残リスク

- Supabase本番相当環境での実データ保存確認は未実施。
- 調理完了後は画面データを再取得するが、通信状況によって料理履歴への反映に少し時間がかかる可能性がある。
- 単位換算は未対応。同じ名前かつ同じ単位の在庫だけを不足判定に使う。

## 次

- 実機スマホで、レシピ保存、献立追加、買い物追加、調理完了を確認する。
- 問題なければ `TKT-0110-csv-migration-tool` へ進む。
