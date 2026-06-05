---
id: SPEC-0077-delete-confirmation-unification
title: 削除確認の統一追加
status: ready
scope:
  - レシピ集のレシピ削除
  - 在庫・買い物リスト・献立一括削除
constraints:
  - `confirm()` は使わず、既存モーダルと同じカスタムUIで確認する
  - Google Spreadsheet への削除は即時通信せず `state.pendingSync` に積み、`syncPendingChanges()` の手動一括同期で反映する
  - 登録待ちリスト、フォーム内行、ジャンルチップ、空の保存場所候補は今回の対象外
acceptance:
  - レシピ削除ボタンを押しても即削除されず、削除確認モーダルが表示される
  - 在庫単体・在庫一括・買い物単体・買い物一括・献立一括削除は削除確認を経由する
  - 在庫数量を減らして0になる場合も削除確認を経由する
  - キャンセル時は対象データと `pendingSync` が変更されない
  - 確定時は既存の `queue*Delete()` 経路で未同期削除として扱われる
related_tickets:
  - TKT-0077-delete-confirmation-unification
---

# Summary

同期対象の永続データ削除に、Canvas環境で動くカスタム確認モーダルを追加する。

## 背景

レシピ集の削除ボタンが確認なしで `deleteRecipe()` に進み、誤操作でレシピが未同期削除状態になる。類似する在庫・買い物リスト・献立一括削除も確認挙動を揃える。

## 仕様

- レシピ・在庫・買い物リストの単体削除は、対象名を表示する削除確認モーダルを出す。
- 在庫・買い物リスト・献立の一括削除は、削除件数を表示する削除確認モーダルを出す。
- 献立単体削除は既存の専用確認モーダルを維持する。
- 削除確定後のデータ処理は既存の `queueRecipeDelete` / `queueInventoryDelete` / `queueShoppingDelete` / `queueScheduleDelete` を使う。
- `executeGAS(...)` の新規呼び出しは追加しない。

## 非対象

- 登録待ちリスト削除
- 保存場所候補の削除
- レシピ編集フォーム内の材料・調味料・手順行削除
- レシピジャンルチップの削除

## Acceptance

- `confirm(` / `alert(` / `prompt(` を追加しない。
- 標準 verify が成功する。
- `project-os/artifacts/TKT-0077/` に verify / 静的監査 / 手動確認項目 / report を残す。
