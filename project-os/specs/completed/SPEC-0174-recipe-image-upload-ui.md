---
id: SPEC-0174-recipe-image-upload-ui
title: レシピ画像の登録・差し替え・削除UI
status: spec_ready
scope:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/lib/ui/recipe-image.ts
  - web/src/lib/
  - web/src/app/globals.css
  - web/src/__tests__/
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - TKT-0173のDB/Storage基盤を前提にする
  - 画像は非公開Storageへ保存し、表示は署名付きURLを使う
  - 元画像をそのまま巨大サイズで保存しない
  - 固定デモ画像とプレースホルダのフォールバックを壊さない
acceptance:
  - レシピ編集画面で画像を選択・プレビュー・保存できる
  - レシピ画像を差し替えた場合、古いStorage objectが不要に残らない
  - レシピ画像を削除でき、削除後は固定デモ画像またはプレースホルダへ戻る
  - レシピ一覧カード・詳細・提案でユーザー登録画像が優先表示される
  - 画像なしレシピは今まで通りプレースホルダで崩れない
  - スマホで画像選択・プレビュー・取り消しが操作できる
  - Web版verifyが通る
related_tickets:
  - TKT-0174-recipe-image-upload-ui
---

# Summary

レシピごとにユーザー画像を登録できるUIを追加する。固定map方式を実運用向けに拡張し、表示優先順位を「ユーザー登録画像 → デモ固定画像 → プレースホルダ」にする。

## 背景

TKT-0172の固定画像はデモ用で、ユーザーが既存レシピに画像を付けられない。レシピカードの価値を出すには、編集画面から画像を登録できる必要がある。

## 仕様

- レシピ編集/作成UIに画像入力を追加する。
  - `accept="image/*"`
  - スマホでも使える配置にする。
- 選択後、保存前にプレビューを出す。
- 保存時にWebP等へ圧縮・リサイズする。
  - 目安: 4:3、最大1280px程度、過大サイズを避ける。
- Storage保存後、`recipes.image_storage_path` を更新する。
- 表示優先順位:
  1. `recipes.image_storage_path` の署名付きURL
  2. `resolveRecipeImage` の固定デモ画像
  3. 既存プレースホルダ
- 削除時はDB列を `null` に戻し、対象Storage objectを削除する。
- 失敗時は「原因」「影響」「修正方法」が分かるエラー表示にする。

## 非対象

- DB/Storage列追加（TKT-0173）。
- 食材画像登録（TKT-0176）。
- AIによる画像生成・自動補完。

## 実装メモ

- 既存の料理記録写真アップロード処理に共通化できる部分があれば使う。
- ただし大きな共通化で既存機能を壊さない。まずレシピ画像に閉じた小さな実装を優先する。
- 画像アップロード中のローディング・二重送信防止を入れる。

## 残リスク

- 画像の縦横比が大きく違う場合、カードで切り抜き位置が悪くなる可能性がある。
- Storage object削除に失敗した場合、不要ファイルが残る可能性がある。ユーザーへの影響は小さいがreportに残す。
