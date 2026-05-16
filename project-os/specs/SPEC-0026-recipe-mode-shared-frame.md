---
id: SPEC-0026-recipe-mode-shared-frame
title: 献立・レシピ Mode B 共通フレーム化
status: implementation_ready
scope:
  - Mode B のレシピ集・AI考案・献立スケジュールUI
  - レシピ集シートの登録日時列追加
constraints:
  - レシピUI操作ごとの即時GAS通信は追加しない
  - pendingSync + syncPendingChanges の手動一括同期を維持する
  - AI生成・レシピ閲覧・献立割り当て・料理完了の既存導線は維持する
acceptance:
  - Mode B は recipeModeTopTabs / recipePrimaryRow / recipeSecondaryRow / recipeSelectRow / recipeListContainer で構成される
  - レシピ集・AI考案・スケジュールのリスト開始位置が揃う
  - レシピ集は 登録日時 / 更新日時 / レシピ名 / 調理回数 / 材料数 でソートできる
  - AI考案は期限が近い食材をリスト本体として表示する
  - スケジュールは週ナビをPrimary行へ移し、日付順 / 未完了優先 / レシピ名順 のソートを持つ
  - レシピ集は 登録日時 と 最終編集日時 を読み書きでき、既存行の登録日時空欄は表示上 最終編集日時 で補完する
  - verify がパスする
related_tickets:
  - TKT-0026-recipe-mode-shared-frame
---

# Summary

Mode B を共通フレームへ再構成し、各タブを色トーン付きのリスト画面として扱う。レシピ集には登録日時を追加し、登録・更新・調理回数などで並べ替えられるようにする。
