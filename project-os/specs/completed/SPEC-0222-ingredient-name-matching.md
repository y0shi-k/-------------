---
id: SPEC-0222-ingredient-name-matching
title: 食材名マッチング（表記ゆれ・類義語の同一視）の共通仕様
status: draft
scope:
  - レシピ食材・調味料名と在庫（inventory_items）名の照合ロジック全般
  - 消費量調整（調理完了時・履歴編集時）の在庫自動紐付け
  - スケジュール追加起点の買い物不足計算・調理ビューの在庫不足バッジ
constraints:
  - クライアント側ロジックのみ。DB schema / Auth・RLS / Storage / AI route / CSV移行は触らない
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 画像表示用の `web/src/lib/ui/ingredient-image.ts` の挙動は変更しない（粒度が異なる別物）
acceptance:
  - 正規化（NFKC・小文字化・空白除去・カタカナ→ひらがな）一致、または類義語辞書一致で同一食材と判定される
  - 部分一致（一方が他方を含む）は「同一」とは判定されず、候補の並び順スコアにのみ使われる
  - 既存の「分類（食材/調味料）一致・単位一致」の条件は緩めない
related_tickets:
  - TKT-0222-ingredient-name-match-util
  - TKT-0223-consumption-stock-auto-match
  - TKT-0224-shopping-shortage-name-match
---

# Summary

レシピ食材名と在庫名の照合が完全一致（`item.name === ingredient.name`）のみのため、
「たまご」と「卵」すら紐付かず、消費量調整は全件手動選択、買い物不足計算は誤って不足扱いになる。
共通のマッチングユーティリティを新設し、消費量調整と買い物不足計算の両方に適用する。

## 背景

- 消費量調整: `web/src/lib/cooking-history/edit.ts` `buildDraftsFromRecipeIngredients`、
  `web/src/components/recipe-meal-workspace.tsx` `buildConsumptionDrafts` が完全一致のみ。
- 買い物不足計算: 同 `inventoryAmountByNameAndUnit` / `compareRecipeWithInventory` が完全一致のみ。
- 既存の正規化・keywords 資産（`web/src/lib/ui/ingredient-image.ts`）は画像分類用で粒度が粗く
  （beef グループに「肉」、fish グループに鮭/さば同居）、在庫マッチングに流用すると誤マッチする。

## 仕様

**マッチング3段階**（ユーザー確定方針 2026-06-10）:

1. **正規化一致**: NFKC 正規化・小文字化・空白除去・**カタカナ→ひらがな**変換後の文字列が等しい
   （例: たまご=タマゴ、ﾄﾏﾄ=トマト=とまと）。→ 同一食材として扱う。
2. **類義語辞書一致**: 同義グループ辞書（卵=玉子=たまご、玉ねぎ=たまねぎ=玉葱=オニオン 等）の
   同一グループに属する。→ 同一食材として扱う。
3. **部分一致**: 正規化後に一方が他方を含む（豚肉↔豚こま切れ肉）。→ **同一とは扱わない**。
   消費量調整プルダウンの「おすすめ候補の並び順」スコアにのみ使う。
   自動選択・買い物不足計算には使わない（誤マッチによる買い忘れ防止）。

**用途別の適用**:

- 消費量調整の在庫自動紐付け: 段階1・2で一致する在庫を自動選択（既存の分類・単位・在庫>0 条件は維持）。
  複数候補時は完全一致（生文字列一致）> 正規化一致 > 辞書一致 の優先順。
- 買い物不足計算（`inventoryAmountByNameAndUnit`）: 段階1・2で一致する在庫量を合算（単位一致は維持）。
- 候補プルダウンの並び順: 段階1〜3のスコア降順で「おすすめ」optgroup 内を並べる。

## 非対象

- 単位換算をまたぐ照合（個↔g 等）。単位不一致は従来どおり別物扱い。
- 画像 resolver（`ingredient-image.ts`）・絵文字 resolver の変更。
- 辞書のユーザー編集UI（将来検討。今回はコード内静的辞書）。

## Acceptance Example

- 在庫「卵 3個」×レシピ「たまご 2個」→ 消費量調整で自動選択され、買い物不足候補に出ない。
- 在庫「豚こま切れ肉 200g」×レシピ「豚肉 150g」→ 自動選択されず不足にも出る（従来どおり）が、
  プルダウンでは「おすすめ」上位に並ぶ。
- `project-os/artifacts/TKT-0222〜0224/` の verify.json・report.md で達成可否を判定できる。
