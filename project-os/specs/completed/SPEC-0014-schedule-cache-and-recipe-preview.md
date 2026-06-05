---
id: SPEC-0014-schedule-cache-and-recipe-preview
title: 献立スケジュールの通信削減とレシピ確認導線
status: ready
scope:
  - 献立スケジュールタブ
  - 献立レシピ選択モーダル
  - 初期DB同期
constraints:
  - タブ切替や週切替で献立スケジュールのGAS通信をしない
  - スプレッドシート書き込みは state.pendingSync に積み、syncPendingChanges() で一括同期する
  - 専用レシピ詳細画面は作らず、既存のレシピ編集画面を使う
acceptance:
  - 初期DB同期で献立スケジュールを state.schedule に読み込む
  - 献立スケジュールタブを押しても loadSchedule() が実行されない
  - 週切替でGAS通信ローディングが出ない
  - レシピ選択モーダルのレシピ本体クリックで既存レシピ編集画面が開く
  - 献立への反映は「献立に追加」ボタン押下時だけ行われる
  - verify がパスする
related_tickets:
  - TKT-0014-schedule-cache-and-recipe-preview
---

# Summary

献立スケジュールは初期DB同期でまとめて取得し、タブ切替や週切替ではローカル状態を描画する。献立へレシピを追加する前に材料と手順を確認できるよう、レシピ選択モーダルから既存のレシピ編集画面を開ける導線を追加する。

## 非対象

- 専用の読み取り専用レシピ詳細画面
- 他端末やスプレッドシート直接編集のタブ切替時自動反映
