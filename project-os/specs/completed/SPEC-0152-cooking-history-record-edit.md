---
id: SPEC-0152-cooking-history-record-edit
title: 料理履歴記録の後編集
status: ready
scope:
  - Web版の料理履歴タイムライン/カレンダーの履歴カード
  - 既存の消費量、写真、コメント、評価の編集
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - Supabase schema / RLS / Storage policy は既存定義を使い、新規マイグレーションは追加しない
  - APIキー、Supabase秘密鍵、写真URLなどの秘匿情報をコードに直書きしない
  - GAS、Google Spreadsheet、Google Drive は使わない
  - 在庫更新は新旧消費量の差分だけ反映し、既存機能の調理完了フローは壊さない
acceptance:
  - タイムライン/カレンダーの全料理履歴カードに編集ボタンが表示される
  - 編集ボタンから既存値入りの編集モーダルを開ける
  - 既存の消費量を編集、在庫品目を付け替え、行を削除できる
  - 保存時は新旧消費量の差分だけ `inventory_items.quantity` に反映される
  - 既存写真を表示して削除でき、新規写真を追加できる
  - コメントと評価を編集でき、保存後に一覧と在庫が再取得される
  - 失敗時は「原因」「影響」「修正方法」を含むエラーメッセージを表示する
  - 在庫差分計算と編集ドラフト生成の単体テストがある
  - `/verify` が通り、必要な成果物が `project-os/artifacts/TKT-0152-cooking-history-record-edit/` に残る
related_tickets:
  - TKT-0152-cooking-history-record-edit
---

# Summary

料理履歴の記録を、作成後でも直せるようにする。対象は消費量、消費する在庫品目、写真、コメント、評価。

## 背景

現在のWeb版では、料理完了時に履歴・消費量・写真を保存できるが、保存後に入力ミスを修正できない。ユーザーが後から正しい消費量や写真、感想を追記できるようにする。

## 仕様

- 料理履歴カード右上に「編集」ボタンを出す。`recipe_id` が無い手入力相当の記録でも表示する。
- 編集モーダルは、既存の消費量調整モーダルに近いUIにする。
- モーダルを開いた時点で `cooking_consumption_events` を取得し、編集用ドラフトを作る。
- 消費量保存時は、元の消費量との差分だけ在庫へ反映する。
- 在庫品目を変更した場合は、旧品目に元の消費量を戻し、新品目から新しい消費量を減らす。
- 行を削除した場合は、旧品目に元の消費量を戻し、消費明細を削除する。
- 既存写真はサムネイルで表示し、削除対象にできる。新規写真は圧縮して Storage に保存し、`photos` に行を追加する。
- 保存後は `router.refresh()` でサーバー取得の履歴と在庫を更新する。

## 非対象

- 新しい消費明細行の追加
- `cooked_at`、`recipe_name`、`meal_schedule_id` の編集
- Supabase schema / RLS / Storage policy の変更
- Canvas版 `app.html` の変更
