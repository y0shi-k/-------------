# コーディング規約

## 必須ルール

1. **二重クリック防止**: GAS通信を伴う全ボタンは、通信中 `disabled` にする（`setStatus()` が自動で制御）。
2. **詳細なステータス表示**: 「処理中...」だけでなく、裏側で何をしているか具体的な日本語ラベルを `executeGAS()` の第2引数に渡す。
3. **エラーハンドリング**: GAS通信失敗時は `alert()` または画面内エリアに理由を表示し、フリーズしない設計にする。`executeGAS` のタイムアウトは90秒。
4. **スキーマ厳守**: データベーススキーマに**絶対に**従う。カラムの追加・削除・リネームは禁止。詳細は `schema.md` を参照。
5. **1ファイル構成**: CSSは `<style>`、JSは `<script>` タグ内に書き、外部ファイル化しない。

## 命名・スタイル

- **関数名**: `camelCase`（例: `batchPredictAI`, `handleStagingSave`）
- **ID・クラス名**: ケバブケース（例: `listContainer`, `stagingActions`）
- **Tailwindクラス**: 既存のUIコンポーネントのクラス構成を踏襲し、デザインの統一性を保つ。
  - カード: `bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100`
  - ボタン（プライマリ）: `bg-indigo-600 text-white font-bold py-4 px-10 hover:bg-indigo-700 active:scale-95 transition-all`
  - バッジ: `text-[9px] font-black px-2 py-0.5 rounded-full`

## 日付フォーマット

- 全ての日付は **YYYY-MM-DD**（ISO 8601）で統一。GAS側では `Utilities.formatDate(..., "yyyy-MM-dd")` を使う。
