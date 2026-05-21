---
ticket_id: TKT-0077-delete-confirmation-unification
status: completed_static_verify
---

# Report

同期対象の永続データ削除に、汎用のカスタム削除確認モーダルを追加した。

## 変更内容

- `deleteConfirmModal` を追加。
- `openDeleteConfirmModal`, `closeDeleteConfirmModal`, `confirmDeleteAction` を追加。
- 以下の削除入口を確認モーダル経由に変更:
  - レシピ単体削除
  - 在庫単体削除
  - 在庫一括削除
  - 在庫数量0による削除
  - 買い物リスト単体削除
  - 買い物リスト一括削除
  - 献立一括削除

## Verify

- Standard verify: passed
- Native dialog check: no matches
- Direct GAS delete path: no new path added

## Manual

Canvas実表示での削除確認 smoke はユーザー確認待ち。
