---
id: TKT-0244-remaining-mutation-sync-cleanup
title: 残りの mutation 経路（買い物リスト・レシピ保存・履歴）の画面間反映を統一する
status: completed
goal: router.refresh() 頼みで他ボードに反映されない残りの更新経路（買い物リスト追加・レシピ保存・料理履歴の編集等）による「リロードしないと出ない」取りこぼしを防ぐ
acceptance:
  - recipe-meal-workspace.tsx の confirmRecipeShortageSelection()（買い物リスト追加）と saveRecipe() について、更新結果が関連ボード（在庫ボードの買い物リスト表示等）にリロードなしで反映される。共有ストア拡張か対象ボードの明示 refetch かは実装時に選び、report に方針を記す
  - cooking-history-board.tsx の履歴編集（料理記録編集モーダル経由の在庫増減を含む）が共有在庫ストアへ反映され、在庫一覧にリロードなしで表示される
  - router.refresh() のみで後続反映を期待している mutation 箇所を web/src/components/ 配下から grep で全列挙し、対応した/対応不要（理由付き）の一覧を report に残す
  - 既存テストが全て pass する
required_evals:
  - web_project_bootstrap
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/components/cooking-history-board.tsx
  - web/src/components/inventory-board.tsx
  - web/src/components/inventory-store.tsx
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0242-shared-inventory-store
related_artifacts:
  - artifacts/TKT-0244-remaining-mutation-sync-cleanup/verify.json
  - artifacts/TKT-0244-remaining-mutation-sync-cleanup/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0244`（= `harness/bin/verify_web.sh`）
  - diff のテーブル名トークンで danger eval が過剰マッチしうるが schema/policy/auth 無変更。report に明記する
  - 必須成果物は verify.json + report.md（非危険変更）
---

# Summary

イニシアチブ「在庫データの全画面即時反映」の T3。TKT-0242/0243 で在庫の主要経路は共有ストア化済み。
本チケットは残りの mutation（買い物リスト・レシピ保存・履歴編集）の取りこぼしを潰し、
「mutation 後に他画面が古いまま」というパターンをリポジトリから一掃する。

## 実装メモ

- 参照すべき既存ファイル:
  - `web/src/components/inventory-store.tsx` … 既存ストアの公開 API。買い物リストをストアに含めるかはここで判断（在庫と同様に複製問題があるなら含める）
  - 調査時に判明した残存箇所: confirmRecipeShortageSelection() / saveRecipe()（いずれも recipe-meal-workspace.tsx、router.refresh() のみ）、cooking-history-board.tsx の履歴系
  - `rg "router\\.refresh" web/src/components/` で全列挙してから着手する
- 「対応不要」と判断する基準: 同一ボード内で完結し他ボードが参照しないデータ（例: ボード内のみのUI状態）
- GAS/Spreadsheet/Drive 不使用、APIキー直書き禁止、RLS 変更なし

## 非ゴール

- 回帰テストの体系的整備（TKT-0245）
- Supabase Realtime の導入（別端末間の同期は本イニシアチブの対象外）

## 依存チケット

- TKT-0242（土台）、TKT-0243（献立側移行）

## 残リスク

- 買い物リストをストアへ含める場合、inventory-board.tsx 側の shoppingItems state との二重管理に注意（片方を撤廃する）
