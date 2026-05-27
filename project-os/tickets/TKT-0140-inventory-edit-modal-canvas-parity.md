---
id: TKT-0140-inventory-edit-modal-canvas-parity
title: 食材管理編集モーダルのCanvas表示寄せ
status: in_progress
goal: Web版の「項目の編集」モーダルをCanvas版の見た目・配置・色・余白に一致させる
acceptance:
  - 編集モーダル（項目の編集）内に保存場所管理・写真登録・登録待ちリストが表示されない
  - 編集モーダルに「購入日」フィールドが存在し、表示期限は1箇所のみ
  - 開封日フィールドが indigo系（bg-indigo-50/border-indigo-100、ラベルtext-indigo-400）
  - AI判定済実質期限カードがCanvas版と同じレイアウト（bg-indigo-50/50、border-indigo-100、p-5、rounded-xl、相対配置バッジ、inputはbg-transparent/text-xl/text-indigo-700）
  - 単位換算がfieldset囲みではなく、グリッドレイアウトで直接配置
  - フォーム要素の余白・padding・border-radiusがCanvas版に近い
  - 「内容を更新する」ボタンのみで「編集をやめる」は存在しない（閉じるは×ボタン/backdrop）
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0140/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
owner_role: implementer
owner_notes:
  - Canvas版 app.html の itemModal（id="itemModal"）を正本とする
  - 既存のSupabase/API処理（saveStaging、confirmStaging等）は一切変更しない
  - 購入日フィールドはDBスキーマ上 created_at を使うのではなく、フォーム値として display_expires_on の重複を purchase_date 相当に移すか、または Canvas版のマークアップ構造に合わせて既存フィールドを再配置する
---

# Summary

Web版 inventory-board.tsx の「項目の編集」モーダル（`editing` 状態）を、Canvas版 `app.html` の `itemModal` に視覚的に一致させる。編集時は登録ハブ用の付帯UI（保存場所管理・写真解析・登録待ちリスト）を非表示にし、品名・分類・保存場所・数量・単位・表示期限・単位換算・購入日・開封日・メモ・AI実質期限・更新ボタンのみを表示する。
