---
ticket_id: TKT-0196-cooking-step-amount-chips
status: ready
verified_at: 2026-06-07T10:29:49+09:00
---

# 実装レポート

## 変更目的

調理ビューの手順を読んでいる時に、文中の材料・調味料と使用量を読みやすく分けて確認できるようにした。

## 今回追加した安全装置

- 既存レシピの手順本文は書き換えず、表示チップだけで補った。
- 手順文に `大さじ1` / `小さじ1` がある場合はCanvas版同様に色付き分量チップ化した。
- 手順文に分量がない材料・調味料は、登録済み使用量を材料名の直後に別チップで補った。
- 手順文に分量が続く場合は、登録済み使用量を重複表示しないようにした。
- `dangerouslySetInnerHTML` などのHTML直接差し込みは使わず、Reactの通常表示で組み立てた。
- 材料名チップのアクセシブル名は材料名のままにし、既存の「押すと左ペインをハイライト」操作を維持した。
- DB schema、Storage、AI/API、認証/RLSは変更していない。
- Canvas版 `app.html` は編集していない。
- APIキーやSupabase秘密鍵の直書きはない。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0196-cooking-step-amount-chips`: pass
  - lint: pass（既存warningあり）
  - typecheck: pass
  - test: pass（35 files / 283 tests）
  - build: pass
  - policy: pass（GAS混入なし、秘密直書きなし、RLS確認）
- 追加テストで、調理ビューの手順チップに `2個`、`大さじ1` が表示され、`1大さじ` が表示されないことを確認した。
- 既存テストで、材料名チップを押して左ペインのハイライトへつながる流れが壊れていないことを確認した。

verify結果は `project-os/artifacts/TKT-0196-cooking-step-amount-chips/verify.json` に保存済み。

## 残リスク

- 手順本文に明示量がない場合は登録済み総量の表示。工程ごとに分けたい場合は別チケットが必要。
- 実機スマホでの見た目確認は未実施。CSS上はチップ内の分量を小さく区切って、読みやすさを優先した。
- verify中に既存の `_removed` 未使用warningと、既存テストの `schedule-1` 重複key警告が出ている。どちらも今回変更箇所ではなく、verify結果はpass。

## 次の依頼や人判断

- 実機スマホで手順チップの分量表示が読みやすいか確認すると安心。
- 工程ごとの使用量を正確に出したい場合は、既存レシピ本文やデータ構造の設計が必要になるため別チケットにする。
