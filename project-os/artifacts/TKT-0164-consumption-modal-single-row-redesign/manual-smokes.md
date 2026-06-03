---
ticket_id: TKT-0164-consumption-modal-single-row-redesign
status: passed
execution_mode: static_only
target_evals:
  - web_project_bootstrap
  - supabase_schema_change
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- web_project_bootstrap（🟢非危険）: Web版Next.js土台のUI変更。
- supabase_schema_change（🔴危険・誤検出）: ticket/spec/plan 本文のテーブル名記載による diff_regex ヒット。実コードはスキーマ/マイグレーション非該当。在庫数量更新・消費明細記録のDB書き込み挙動への影響を本スモークで観点化する。

## executed_checks

- 静的検証（`/verify`）: lint / typecheck / test / build すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）pass。
- 自動テスト（`recipe-meal-workspace.test.tsx`）で完了モーダルの主要フローを再現・確認:
  - 既定（在庫あり材料）で確定 → `inventory_items` を quantity=0 に更新、`cooking_consumption_events` に consumed_amount=1 で挿入（test 717、回帰なし）。
  - 消費量を0にして確定 → `inventory_items` 更新なし・`cooking_consumption_events` 挿入なし（除外が「消費量0」で機能、新規 test）。
  - 消費量 > 在庫 で「在庫不足」警告が表示される。
  - 一括ボタン「全部 既定量」「全部 0」が存在する。

## skipped_checks

- 実ブラウザ／実Supabaseでのエンドツーエンド確認は未実施（static_only）。下記 open_risks の観点で実機確認を推奨:
  - 完了モーダルが1材料1〜2行の高密度で表示され、チェックボックスと「減算しない」が無いこと。
  - exact match 在庫がある材料に在庫が pre-select され既定量が入ること。
  - 「全部 0」で全行0かつ淡色（data-active=false）、「全部 既定量」で在庫のある行に既定量が戻ること。
  - 消費量に全角「２００」を入れて半角化されること（NumberField）。
  - 同分類・同単位の在庫が無い材料でも在庫selectが表示され、「その他の在庫（代替材料）」から別の在庫を選んで減算できること（在庫が1件も無いときのみ「在庫がありません」）。
  - ブラウザ幅が狭いとき在庫select＋消費量が自動で2段目へ折り返すこと。
  - 料理履歴編集モーダルが従来どおり（チェックボックス・減算しない・縦積み・保存/削除/在庫差分）で回帰がないこと。

## open_risks

- 実Supabaseでの在庫減算は自動テストではモックのため、本番DBでの数量更新は実機スモークで最終確認することが望ましい。
- 「減算しない」廃止により在庫がある材料は既定で減算対象。exact match 無しは amount 0 で従来同様減算されない想定（自動テストで確認済み）。
