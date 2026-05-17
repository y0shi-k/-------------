---
id: SPEC-0056-schedule-card-action-menu
title: スケジュール献立カードの開始導線と削除確認
status: spec_ready
scope:
  - app.html のスケジュール献立カード
  - 献立スロット操作メニュー
  - 単体献立削除確認モーダル
constraints:
  - スプレッドシートスキーマ変更なし
  - GAS通信パターン変更なし
  - state.pendingSync 構造変更なし
  - alert / confirm / prompt は使用しない
acceptance:
  - スケジュール画面の献立カード内に開始ボタンが表示されない
  - 献立カードクリックで操作メニューが開き、調理を開始、別のレシピに変更、削除するを選べる
  - 調理を開始で該当レシピの調理ビューへ遷移し、returnTo は schedule になる
  - 単体削除は確認モーダルでキャンセルでき、確認後だけ pendingSync に削除が積まれる
  - verify が PASS する
related_tickets:
  - TKT-0056-schedule-card-action-menu
---

# Summary

献立カード内の小さな開始ボタンではレシピ名が見えにくいため、カード上の主要操作を操作メニューに集約する。単体削除は誤操作防止のため確認モーダルを挟む。
