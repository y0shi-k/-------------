---
ticket_id: TKT-0075-modal-backdrop-close-policy
status: ready
---

# Report Draft

## 変更目的

入力中・選択中のモーダルが、誤った画面外クリックで閉じて内容を失う問題を防ぐ。

## 今回追加した安全装置

- モーダル背景クリックを `handleModalBackdropClick()` に集約した。
- 入力・選択フローのモーダルは背景クリックで閉じないようにした。
- 軽いメニュー・確認系モーダルだけ背景クリックで閉じる許可リストに残した。
- AIレシピプレビューは生成直後は閉じず、既存レシピ閲覧時だけ閉じる状態別制御にした。

## 実施した確認

- 標準 verify: passed
- 旧 inline 背景クリック条件の残存確認: no matches
- native dialog 静的確認: no matches

## 残リスク

- Gemini Canvas 上の実機タップ確認はユーザー手動確認が必要。

## 次の依頼や人判断

- Canvasでレシピ追加/編集モーダルを開き、画面外クリックで閉じないことを確認する。
