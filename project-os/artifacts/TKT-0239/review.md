---
ticket_id: TKT-0239-consumption-dialog-inventory-refetch
status: passed
review_scope:
  - SPEC-0125-cooking-completion-consumption-web
  - TKT-0239-consumption-dialog-inventory-refetch
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/components/recipe-meal-workspace.tsx（fetchFreshInventoryForMeals 新設 / buildConsumptionDrafts 引数化 / completeSchedule のオープン分岐 / isOpeningConsumption ガード / 完了ボタン disabled）
- web/src/__tests__/recipe-meal-workspace.test.tsx（新規2件 + 既存モックの select チェーン追補）

## checked_artifacts

- artifacts/TKT-0239/verify.json（status: pass・レビュー指摘の修正後に再実行）
- artifacts/TKT-0239/report.md
- artifacts/TKT-0239/manual-smokes.md

## subagent_usage

- 実装: impl-deep（Opus）。route_model.py は impl-fast 判定だったが、非同期 state の設計判断（stale read 回避・フォールバック設計）を含むためオーケストレーターが impl-deep に上書き（ユーザー承認済みの振り分け）
- レビュー・検証・修正: オーケストレーター（Fable 5 メインセッション）

## findings

- 設計方針（チケット記載・承認済み）どおり: 共有state化ではなくダイアログオープン時の最小リフェッチ。取得結果をローカル変数で `buildConsumptionDrafts` に直接渡し、setState 直後の stale read を回避している
- select の列・絞り込み・並び順が page.tsx の初回フェッチと一致していることを確認（表示順・列欠落の回帰なし）
- **指摘1件（修正済み）**: `fetchFreshInventoryForMeals` が supabase クライアントのネットワーク例外で throw した場合、`completeSchedule` 側で `isOpeningConsumption` が解除されず完了ボタンが永久ロックされる穴があった。オーケストレーターが try/catch を追補し、例外時も null → 既存スナップショットへフォールバックする挙動に統一。修正後 verify 再実行で全 pass
- 軽微（許容）: 再入ガードが state ベースのため同一 tick 内の二連打は理論上すり抜けるが、ボタン disabled が実質カバー。実害なしと判断
- cooking-record-edit-modal への同修正は、保存パスの在庫差分計算（previousQuantity）との不整合で在庫を誤更新するリスクがあるため見送り。判断は妥当（report.md に理由記録済み）

## open_risks

- ユーザー事象が単位/分類不一致ケースの場合は未解消（実機切り分け待ち）
- cooking-record-edit-modal の鮮度問題は別チケット候補として残存

## verdict

passed — 指摘1件は修正・再 verify 済み。schema/policy 無変更（eval 過剰マッチは記録済み）。実機スモークのみユーザー残
