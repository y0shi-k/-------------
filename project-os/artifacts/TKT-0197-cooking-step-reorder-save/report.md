---
ticket_id: TKT-0197-cooking-step-reorder-save
status: ready
verified_at: 2026-06-07T10:30:15+09:00
---

# 実装レポート

## 変更目的

調理中に手順・材料・調味料の順番を変えたくなった時、編集画面に戻らず調理ビュー上で並び替え、確定時にレシピ本体へ保存できるようにした。

## 今回追加した安全装置

- 並び替え直後は画面内の一時変更にとどめ、`並び替えを確定` を押すまでDBへ保存しない。
- 手順の保存対象は既存の `recipes.prep_steps` / `recipes.steps` に限定した。
- 材料・調味料の保存対象は既存の `recipe_ingredients.sort_order` / `recipe_ingredients.item_type` に限定した。
- 献立、料理履歴、消費履歴、在庫減算ロジックは変更していない。
- D&Dの操作目印として、行左側に3本線ハンドルを追加した。
- Undo / Redo を追加し、保存前の並び替えを戻せるようにした。
- 移動した行は未確定中に色付き枠で分かるようにした。
- 未保存の並び替えがある状態で調理完了へ進む場合は、保存してから完了へ進むか確認する。
- 保存エラーは「原因」「影響」「修正方法」が分かるメッセージにした。
- DB schema、Storage、AI/API、認証/RLSは変更していない。
- Canvas版 `app.html` は編集していない。
- APIキーやSupabase秘密鍵の直書きはない。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0197-cooking-step-reorder-save`: pass
  - lint: pass（既存warningあり）
  - typecheck: pass
  - test: pass（35 files / 283 tests）
  - build: pass
  - policy: pass（GAS混入なし、秘密直書きなし、RLS確認）
- 追加テストで、下ごしらえの手順を調理工程へ移動し、`並び替えを確定` で `prep_steps` / `steps` が期待どおり保存されることを確認した。
- 追加テストで、材料・調味料をまたいだ移動、Undo / Redo、`sort_order` / `item_type` の保存を確認した。
- 既存テストで、調理完了、消費量確認、料理履歴保存、在庫減算が壊れていないことを確認した。

verify結果は `project-os/artifacts/TKT-0197-cooking-step-reorder-save/verify.json` に保存済み。

## 残リスク

- HTML5 D&Dはスマホブラウザで操作しづらい場合がある。3本線ハンドルは操作目印として追加したが、実機での操作感確認は未実施。
- 未保存の並び替え確認は既存の確認UIを流用している。専用デザインが必要なら別チケットで調整する。
- verify中に既存の `_removed` 未使用warningと、既存テストの `schedule-1` 重複key警告が出ている。どちらも今回変更箇所ではなく、verify結果はpass。

## 次の依頼や人判断

- 実機スマホで3本線ハンドルによるD&Dが操作しやすいか確認すると安心。
- D&Dの専用ライブラリ導入や長押し操作など、より本格的なモバイルD&Dは別チケットにする。
