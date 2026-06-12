---
id: SPEC-0242-shared-inventory-store
title: 在庫データの全画面即時反映（共有在庫ストア化）
status: draft
scope:
  - web-mode-shell 配下の3ボード（在庫一覧 / 献立・レシピ / 料理履歴）間の在庫データ同期
  - 在庫を増減させる全 mutation（調理完了・ロールバック・補充・追加・編集・消費・履歴編集・買い物リスト連携）
constraints:
  - 触らない範囲: Supabase schema / RLS ポリシー / Storage / AI route（クライアント側 state 構成のみ変更）
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 個人データ・写真・auth/RLS を扱う場合は、ログイン必須・Supabase RLS・Storage非公開・APIキー非露出を守る
  - SWR/React Query・Supabase Realtime は導入しない（新規依存なし）
acceptance:
  - 献立スケジュールで調理完了（在庫減算）後、在庫一覧タブへ切り替えるとリロードなしで減算後の数量が表示される
  - 在庫一覧での追加・補充が、献立側の消費自動マッチングにリロードなしで反映される
  - ロールバック・完了スケジュール削除・履歴編集による在庫増減も同様に全ボードへ即反映される
  - クロスボード反映の回帰テスト（jsdom）が存在し `/verify` で実行される
related_tickets:
  - TKT-0242-shared-inventory-store-foundation
  - TKT-0243-meal-workspace-inventory-store-migration
  - TKT-0244-remaining-mutation-sync-cleanup
  - TKT-0245-cross-board-sync-regression-tests
---

# Summary

調理完了で在庫を減らしても在庫一覧に戻ると反映されず、リロードが必要になることがある（ユーザー報告 2026-06-12）。
本 spec は在庫データを共有ストア（Context）へ一本化し、全画面で即時反映させるイニシアチブの正本。

## 背景

- 3ボードは web-mode-shell.tsx で常時マウント（hidden 切替・266c477）。各ボードが server props を `useState(initialXxx)` に複製しており、mutation 後は `router.refresh()` のみで兄弟ボードの state は更新されない。
- TKT-0239 で「使う瞬間の最小リフェッチ」による部分対応を実施済みだが、対象が消費ダイアログに限られ、アプリ全体の即時反映要望には不足。learnings（2026-06-12）の「共有 state への持ち上げは必要になるまでやらない」の"必要になった"段階と判断し、ユーザー承認の上で持ち上げに踏み切る。

## 仕様

- shell 配下に共有在庫ストア Context（Provider + hook）を新設。在庫（現役/アーカイブ）・保管場所を単一ソース化し、「state + 楽観的 setter + refetch」を公開する。
- 各ボードは在庫系 `useState(initialXxx)` 複製を撤廃し、ストア参照へ移行する。mutation はストアの setter を呼ぶことで全ボードへ即伝播する。
- refetch の select・整形は `page.tsx` の初回フェッチと整合させる。
- Web版ポリシー: GAS/Spreadsheet/Drive 不使用。APIキー・秘密鍵は環境変数管理。RLS/Storage 権限は既存のまま変更しない。

## 非対象

- 別端末・別セッション間のリアルタイム同期（Supabase Realtime）
- 献立スケジュール・レシピ本体データの共有ストア化（在庫系データのみ）

## Acceptance Example

- `project-os/artifacts/TKT-0242〜0245/` の verify.json + report.md で達成可否を判定できる
- TKT-0243 完了時点で発端の不具合（調理完了→在庫一覧が古い）が解消されている
