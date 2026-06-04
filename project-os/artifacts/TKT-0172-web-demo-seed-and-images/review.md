---
ticket_id: TKT-0172-web-demo-seed-and-images
status: passed
checked_at: 2026-06-04T21:32:00+09:00
review_scope:
  - 静的デモ画像配置
  - デモシードスクリプト
  - 画像resolver整合テスト
  - gate過剰マッチ確認
checked_diff_paths:
  - project-os/specs/SPEC-0172-web-demo-seed-and-images.md
  - project-os/tickets/TKT-0172-web-demo-seed-and-images.md
  - web/public/images/hero/home-hero.webp
  - web/public/images/recipes/recipe-chicken-stir-fry.webp
  - web/public/images/recipes/recipe-nikujaga.webp
  - web/public/images/recipes/recipe-hamburg.webp
  - web/public/images/recipes/recipe-mapo-tofu.webp
  - web/public/images/recipes/recipe-grilled-salmon.webp
  - web/public/images/recipes/recipe-curry-rice.webp
  - scripts/seed-demo-recipes.mjs
  - web/src/__tests__/recipe-image.test.ts
---

# Review

## 結論

重大な問題は見つからない。TKT-0172 は静的画像配置と追加専用シード手段に限定され、schema / RLS / Storage は変更していない。

## 確認したこと

- `web/public/images/recipes/` に最低条件の6枚を配置した。
- `web/public/images/hero/home-hero.webp` を配置した。
- 料理画像はすべて `640x480`、ヒーローは `1200x400`。
- 合計サイズは `212K` で過大ではない。
- `web/src/lib/ui/recipe-image.ts` の既存mapは6レシピと一致していたため、本体コード変更は不要。
- `web/src/__tests__/recipe-image.test.ts` に、6レシピが期待パスへ解決され、実ファイルが存在するテストを追加した。
- `scripts/seed-demo-recipes.mjs` は `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_AUTH_TOKEN` を環境変数から読む。秘密情報の直書きはない。
- シードはユーザー本人のJWTでREST APIを呼ぶため、通常のRLS下で動く。
- 既存の同名デモレシピはスキップし、削除・更新・upsert はしない。
- 既存の `harness/bin/hook_ticket_reminder.py` に未コミット変更があるが、今回の作業では触っていない。

## checked_diff_paths

- `project-os/specs/SPEC-0172-web-demo-seed-and-images.md`
- `project-os/tickets/TKT-0172-web-demo-seed-and-images.md`
- `web/public/images/hero/home-hero.webp`
- `web/public/images/recipes/*.webp`
- `scripts/seed-demo-recipes.mjs`
- `web/src/__tests__/recipe-image.test.ts`
- `project-os/artifacts/TKT-0172-web-demo-seed-and-images/*`

## checked_artifacts

- `project-os/artifacts/TKT-0172-web-demo-seed-and-images/verify.json`
- `project-os/artifacts/TKT-0172-web-demo-seed-and-images/manual-smokes.md`
- `project-os/artifacts/TKT-0172-web-demo-seed-and-images/review.md`
- `project-os/artifacts/TKT-0172-web-demo-seed-and-images/report.md`

## findings

- 重大な問題なし。
- `check-gates` の危険evalは過剰マッチ。実態としてschema / RLS / Storage / CSV移行は変更なし。

## リスク

- `SUPABASE_AUTH_TOKEN` はログイン済みユーザーの一時トークンであり、漏らすと本人権限でDB操作される恐れがある。実行時はシェル履歴や共有ログに残さない運用が必要。
- シードは同名レシピをスキップする設計のため、既存レシピ名とデモ名が衝突した場合、そのレシピの材料は追加しない。既存データを壊さないことを優先した判断。
- DB投入後の全画面写真表示は、ユーザーが明示実行した後に改めて目視確認が必要。

## open_risks

- DB投入後の全画面写真表示は未確認。
- `SUPABASE_AUTH_TOKEN` の取り扱いに注意が必要。

## verdict

pass。TKT-0172 の範囲として実装・verify・artifact 記録は完了。

## Verify

- `node --check scripts/seed-demo-recipes.mjs`: pass
- `npm test -- recipe-image.test.ts`: pass
- `harness/bin/verify_web.sh TKT-0172-web-demo-seed-and-images`: pass
