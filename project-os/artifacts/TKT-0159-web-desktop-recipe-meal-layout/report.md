---
ticket_id: TKT-0159-web-desktop-recipe-meal-layout
status: ready
generated_at: 2026-06-03T22:58:00+09:00
---

# TKT-0159 実装レポート

## 変更目的

PC幅の「献立・レシピ」画面を、TKT-0157の左サイドバーと連動する広幅レイアウトにした。スマホ幅では従来の内部タブと縦型スケジュールを維持した。

## 今回追加した安全装置

- `RecipeMealWorkspace` が `useShellSubView()` と同期し、PCサイドバーの「レシピ」「献立スケジュール」選択で表示が切り替わるようにした。
- スマホ用の `.recipe-subnav` は残し、PC幅だけCSSで非表示にした。
- レシピ一覧、レシピ詳細、献立スケジュールの変更はレイアウト中心に限定した。
- AI生成API、Supabase保存処理、写真Storage、APIキー管理は変更していない。

## 実施した確認

- `npm run test -- recipe-meal-workspace.test.tsx`: pass（24 tests）
- `npm run typecheck`: pass
- `harness/bin/verify_web.sh TKT-0159-web-desktop-recipe-meal-layout`: pass
  - lint: pass
  - typecheck: pass
  - test: pass（17 files / 125 tests）
  - build: pass
  - GAS混入なし、秘密直書きなし、Supabase RLS確認 pass
- ブラウザ確認（PC幅 1280px）:
  - 内部タブ `.recipe-subnav` が非表示
  - レシピ一覧が3列グリッド
  - レシピ詳細のヒーロー風エリアが表示
  - 献立スケジュールが7列、朝・昼・晩の3行相当で表示
- ブラウザ確認（スマホ幅 390px）:
  - 内部タブ `.recipe-subnav` が表示
  - レシピ一覧が1列
  - スケジュールは従来の縦アジェンダ表示を維持

## 残リスク

- 実データ量が多いユーザーでは、PC幅のスケジュール横グリッドでカード名が長い場合に省略表示が増える可能性がある。
- PC実機の広い画面では確認したが、タブレット境界付近（1024px前後）は追加の目視確認をするとより安全。

## 次の依頼や人判断

- 実機でPC/スマホ両方を見て、レシピ詳細のヒーロー風エリアの見た目がモックの方向性に合っているか確認する。
- 必要なら次チケットで、実写真を持つレシピ詳細ヒーローや、1024px前後の余白調整を扱う。
