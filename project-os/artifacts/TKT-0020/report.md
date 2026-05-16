# TKT-0020 実装完了報告（修正版）

## 概要

SPEC-0020 に基づき、料理完了時の消費量調整モーダルと在庫減算処理を実装しました。
ユーザーからの追加要望に応じて、在庫不足時でも完了できるように改善しました。

## 変更内容

### 1. 料理記録画面（モードC）の材料タブ改善
**`renderCookingIngredients`** を修正：
- 各材料の下に「在庫: X個 / 必要: Y個」を同時表示
- 在庫不足の材料は行全体を赤系（`bg-rose-50 border-rose-200`）にハイライト
- 不足時は「⚠️ 不足」バッジ、在庫あり時は「在庫あり」バッジを表示
- 在庫テキストの色も不足時は赤（`text-rose-500`）、在庫あり時は緑（`text-emerald-600`）

### 2. 消費量調整モーダル改善
**`openConsumptionAdjustmentModal`**（各行レンダリング）を修正：
- 品名の下に「規定量: X / 在庫: Y」を同時表示
- 在庫不足の材料は行全体を赤系（`bg-rose-50 border-rose-200`）にハイライト
- 不足時は「不足」バッジを表示

**`validateConsumptionInputs`** を修正：
- 在庫超過の材料がある場合、警告メッセージに不足材料名を列挙
- メッセージ: 「在庫が不足する材料があります（A、B）。減らせる分だけ減らして完了します。」
- **確定ボタンは無効化しない**（在庫不足でも完了可能）

**`confirmConsumption`** を修正：
- 在庫超過の材料は、在庫分だけ減らして完了（`Math.min(currentQty, remaining)` で減算）
- 結果を詳細なトーストで報告：
  - 1秒後: 「在庫を更新しました（更新 N件 / 削除 M件）。同期するまでスプシ未反映です。」
  - 2.5秒後: 「A は在庫不足（2個しかない）のため、全在庫を消費しました / B を 3個 消費しました」

### 3. その他
- モーダル初期表示時にも `validateConsumptionInputs()` を実行し、初期状態から不足警告を表示
- `alert` / `confirm` / `prompt` は不使用
- 個別の `executeGAS` 呼び出しは増やしていない（`syncPendingChanges()` 経由のみ）

## verify 結果

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# → VERIFY_PASSED
```

追加チェック：
- `alert` / `confirm` / `prompt` 不使用
- `showToast` 関数存在確認
- `executeGAS` の呼び出しは既存の4箇所のみ（新規追加なし）

## 変更ファイル

- `app.html`
- `project-os/artifacts/TKT-0020/verify.json`
- `project-os/artifacts/TKT-0020/report.md`
- `project-os/tickets/TKT-0020-consumption-adjustment.md`
