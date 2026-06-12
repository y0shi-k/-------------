---
id: TKT-0245-cross-board-sync-regression-tests
title: クロスボード即時反映の回帰テストを追加する
status: draft
goal: 「調理完了後に在庫一覧が古いまま」「在庫追加が献立の自動マッチに出ない」というクロスボード鮮度バグの再発を、自動テストで検出できない状態を防ぐ
acceptance:
  - jsdom（vitest）テストで「調理完了（消費確定）→ 共有ストアの在庫が減算され、在庫一覧側の参照が更新される」ことを検証するテストを追加する
  - jsdom テストで「在庫追加/補充 → 献立側の在庫参照（自動マッチング入力）に反映される」ことを検証するテストを追加する
  - 上記テストは Supabase クライアントをモックし、共有ストア（inventory-store）を実物で通す（ストア自体をモックしない）
  - `/verify` が pass する（既存テスト含め全 green）
  - 任意（推奨）: ローカル Supabase + Playwright で「調理完了→在庫タブ切替で減算表示（リロードなし）」のスモークを learnings 2026-06-12（TKT-0241 節）の手順で実施し、結果を report に残す。実施しない場合は理由を記す
required_evals:
  - web_project_bootstrap
eval_selection_mode: auto
changed_paths:
  - web/src/__tests__/
  - web/src/components/inventory-store.tsx
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0242-shared-inventory-store
related_artifacts:
  - artifacts/TKT-0245-cross-board-sync-regression-tests/verify.json
  - artifacts/TKT-0245-cross-board-sync-regression-tests/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0245`（= `harness/bin/verify_web.sh`）
  - テスト追加が主のため danger eval には該当しない。必須成果物は verify.json + report.md
  - 本番/hosted データでの消費系E2Eは行わない（実在庫を減らすため。ローカルスタック一択 — learnings 参照）
---

# Summary

イニシアチブ「在庫データの全画面即時反映」の T4（締め）。TKT-0242〜0244 の構造変更を回帰テストで固定する。

## 実装メモ

- 参照すべき既存ファイル:
  - `web/src/__tests__/` 配下の既存テスト … モック・レンダリングのパターンに合わせる（特に TKT-0239 で追加された消費ダイアログ系テスト）
  - `web/src/components/inventory-store.tsx` … テスト容易性のための小さな export 追加は可（ロジック変更は不可）
  - `project-os/knowledge/learnings.md` 2026-06-12「ローカルSupabase + Playwright…」… E2E スモーク手順の再現レシピ（supabase db reset は禁止、migration up を使う）
- テスト名・配置は既存規約に合わせる。カバレッジ目標より「再発時に必ず落ちる」ことを優先する

## 非ゴール

- 機能追加・リファクタ（テストの都合での実装変更は最小限）
- CI への Playwright 組み込み（ローカル手動スモークまで）

## 依存チケット

- TKT-0242、TKT-0243、TKT-0244（全ての構造変更が完了していること）

## 残リスク

- 常時マウント3ボードを同時レンダリングする統合テストは重くなりうる。重すぎる場合はストア単体＋各ボードの結合を分けて検証する
