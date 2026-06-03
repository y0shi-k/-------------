---
ticket_id: TKT-0164-consumption-modal-single-row-redesign
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

「料理を完了する」→「実際の消費量を調整」モーダル（`ConsumptionEditor`、`web/src/components/recipe-meal-workspace.tsx`）が縦に細長く見にくい問題を解消する。
根本原因は「減算しない」を表す手段が3重（チェックOFF／在庫セレクトの「減算しない」／消費量0）に存在したこと。保存ロジックは `if (!draft.selected || !draft.stockItemId || draft.consumedAmount === 0) continue;` で、どれか1つでも減算をスキップしており冗長だった。
完了モーダルは一度きりの減算なので、除外を「消費量0」だけに一本化し、材料名＋在庫select＋消費量(+単位)を横一列にする高密度レイアウトへ刷新した。
また、代替材料を在庫から減らすケースに対応するため、在庫selectは常に表示し、同分類・同単位の在庫を「おすすめ（同分類・同単位）」optgroup、それ以外の在庫（数量>0）を「その他の在庫（代替材料）」optgroup に分けて、どの在庫からでも減算先を選べるようにした（「対象在庫なし」でselectを隠す挙動は廃止）。

## 今回追加した安全装置

- 料理履歴編集モーダル `cooking-record-edit-modal.tsx`（`ConsumptionEditList`）は**無改変**。そこではチェックOFF＝消費明細のDB削除＋在庫差分の戻し、「減算しない」＝在庫非紐づけだが記録は残す、という固有意味を持つため、統一は在庫差分計算を壊す危険変更になる。今回はスコープから除外した。
- 共有CSS `.consumption-item` 系（globals.css L3981-4039）は変更せず、完了モーダル専用の新規クラス（`.consumption-row` ほか）を追加して結合を断った。編集モーダルの見た目・挙動を維持。
- `selected` の他用途 `shortageSelectionItems`（recipe-meal-workspace.tsx L324-325, L1066, L1723）は別機能のため無改変。
- 消費量入力を既存 `NumberField`（全角→半角正規化、TKT-0154導入）に置換し、全角数字混入を防止。
- バリデーションを「在庫を選んでいる行のみ」に限定（`draft.stockItemId && (!Number.isFinite || <0)`）し、不正値ガードを維持。
- DBスキーマ／RLS／Storage／AI route／CSV移行には触れず、既存の在庫数量更新・消費明細記録のDB呼び出し自体は変更していない（減算ゲートの条件のみ変更）。

## 実施した確認

- `/verify TKT-0164-consumption-modal-single-row-redesign`：lint / typecheck / test / build すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）も pass。
- 既存テスト `web/src/__tests__/recipe-meal-workspace.test.tsx` を新設計に更新：
  - 完了モーダルの一括ボタンを「全部 既定量」「全部 0」に修正。
  - 除外操作を「チェックOFF」から「消費量を0にする」に変更し、在庫減算（inventory_items 更新）も消費明細記録（cooking_consumption_events 挿入）も行われないことを確認。
  - 既定で在庫がある材料（玉ねぎ）は確定時に減算・記録される既存ケース（test 717）はそのまま pass。
- `manual-smokes.md` に実機スモーク観点を記載（後述）。

## 残リスク

- 「減算しない」廃止により、在庫がある材料は既定で減算対象になる。exact match が無い材料は stockItemId 未選択（amount 0）で従来同様減算されないため、既定の挙動は維持される。
- 完了モーダルと料理履歴編集モーダルの見た目が一時的に不揃いになる。編集モーダルの統一は危険変更（在庫差分計算）を伴うため別チケットで扱う。
- `check-gates` が `supabase_schema_change` を🔴判定したが、これは本チケットの ticket/spec/plan 本文にテーブル名（inventory_items 等）を記載したことによる diff_regex の誤検出。実コードはスキーマ/マイグレーションに非該当。念のため manual-smokes / review も作成した。

## 次の依頼や人判断

- 必要なら別チケットで料理履歴編集モーダル（`cooking-record-edit-modal.tsx`）の同等レイアウト統一を検討（チェックボックスの「明細削除」意味を保ったまま行う危険変更）。
- 「全部 既定量／全部 0」のボタン文言は仮。実機での分かりやすさを見て調整可。
