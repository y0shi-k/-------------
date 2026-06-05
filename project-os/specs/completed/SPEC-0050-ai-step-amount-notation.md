---
id: SPEC-0050-ai-step-amount-notation
title: AIレシピ工程の材料・調味料分量明記
status: ready
scope:
  - app.html 内の AI プロンプト（parseRecipeTextWithAI / generateAiRecipeFromPlan）
constraints:
  - スプレッドシートスキーマ変更なし
  - GAS通信パターン変更なし
  - UIコンポーネント追加なし
  - 既存レシピデータの自動変換なし
acceptance:
  - AI考案レシピ生成の steps / prepSteps で、工程文中の材料・調味料に分量が併記される
  - テキスト解析の steps / prepSteps でも同様に分量が併記される
  - 同じ材料・調味料が複数工程に出る場合、各工程で使用量または「分量不明」が併記される
  - 分量根拠がない場合、AIが勝手に按分せず「分量不明」と明記する
  - verify が PASS すること
related_tickets:
  - TKT-0050-ai-step-amount-notation
---

# Summary

AIが構造化・生成するレシピ工程で、材料や調味料の量が工程文から分からない問題を防ぐ。材料・調味料一覧の `amount` / `unit` は維持しつつ、`prepSteps` / `steps` の文字列にも `バター（10g）` のような分量表記を必ず入れる。

## 仕様

- `parseRecipeTextWithAI` と `generateAiRecipeFromPlan` のプロンプトに工程内分量ルールを追加する。
- 工程文に登場する材料・調味料は必ず `名称（分量）` 形式で書く。
- 分量は `ingredients` / `seasonings` の `amount + unit` と矛盾しないようにする。
- 同じ材料・調味料が複数工程に登場する場合も、各工程ごとに使用量を併記する。
- 各工程の使用量が本文から分からない場合は、総量が分かっていても勝手に按分せず `名称（分量不明）` と書く。

## 非対象

- レシピ保存形式の変更
- 既存レシピの一括修正
- 表示UIの追加
- GAS / Spreadsheet 書き込み処理の変更
