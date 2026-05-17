# TKT-0050 Report

## Summary

AIレシピ考案・テキストからレシピ構造化のプロンプトに、工程文中の材料・調味料へ分量を必ず併記するルールを追加した。

## Changes

- `generateAiRecipeFromPlan` の最終JSON生成プロンプトに以下を追加:
  - `prepSteps` / `steps` の材料・調味料は `名称（分量）` 形式で記述
  - 同じ材料・調味料が複数工程に出る場合も、各工程ごとに使用量を記述
  - 各工程の使用量が不明な場合は、勝手に按分せず `名称（分量不明）`
- `parseRecipeTextWithAI` のテキスト構造化プロンプトにも同じルールを追加。
- `SPEC-0050` / `TKT-0050` を作成し、プロンプト変更の仕様と実装条件を記録。

## Verification

- 標準 verify: `VERIFY_PASSED`
- `alert(` / `confirm(` / `prompt(`: 該当なし
- スプシスキーマ変更なし
- GAS通信パターン変更なし
- UI追加なし

## Residual Risk

実際の Gemini 出力がプロンプトを完全に守るかはモデル依存。Canvas環境で、同一材料が複数工程に出るレシピを入力して、各工程が `名称（分量）` または `名称（分量不明）` になることを確認する。
