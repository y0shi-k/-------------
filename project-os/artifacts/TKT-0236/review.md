---
ticket_id: TKT-0236-inventory-bulk-delete
status: passed
review_scope:
  - SPEC-0105-inventory-and-staging-web
  - TKT-0236-inventory-bulk-delete
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/components/inventory-board.tsx（deleteSelectedInventoryItems 新設・ListToolbar への選択削除ボタン接続）
- web/src/__tests__/inventory-board.test.tsx（テスト2件追加）

## checked_artifacts

- project-os/artifacts/TKT-0236/verify.json（status: pass）
- project-os/artifacts/TKT-0236/manual-smokes.md（status: passed）

## subagent_usage

- impl-fast（Sonnet）に実装を委譲。route_model.py の判定は「非危険 eval のみ: pwa_mobile_ui → fast」。オーケストレーター（Fable 5）がコードレビューと verify を実施。

## findings

- `deleteSelectedInventoryItems` は買い物リストの `deleteSelectedShoppingItems` の忠実な同型移植で、`.eq("user_id", userId).in("id", ...)` の二重防御・成功後のみの state 更新（楽観的更新なし）・「原因/影響/修正方法」形式のエラーメッセージを踏襲している。
- 後処理は単体削除 `deleteItem` と同等（`clearQuantityNotation`・notations 掃除・選択クリア・編集中なら `resetForm`）。`deletedIds = [...selectedInventoryIds]` でスナップショットを取ってから各 state を更新しており、非同期中の選択変更に対しても一貫する。
- `setQuantityNotations` 内の `delete next[id]` はコピー後のローカル変数への操作で、既存 `deleteItem` と同一パターン（外部から見てイミュータブル）。
- 確認パネルは既存 `requestDelete` → `DeleteConfirmPanel` 経由で、確認なし削除の経路は存在しない。選択0件時は `ListToolbar` の `disabled || selectedCount === 0` で非活性。
- 危険 eval の自動マッチは `inventory_items` トークン等の語彙過剰マッチと並行セッション（TKT-0228〜0233 auth）の未コミット変更の同居によるもの。本チケット2ファイルの diff に schema / RLS / Storage 変更がないことを確認した。

## open_risks

- undo 無しの一括物理削除（非ゴールとして明示済み）。確認パネル＋件数明示で抑止。

## verdict

- passed。既存の確立されたパターンの複製であり、削除経路は確認パネル必須・user_id スコープ付きに限定されている。
