# コーディング規約

## 必須ルール

1. **二重クリック防止**: GAS通信を伴う全ボタンは、通信中 `disabled` にする（`setStatus()` が自動で制御）。
2. **詳細なステータス表示**: 「処理中...」だけでなく、裏側で何をしているか具体的な日本語ラベルを `executeGAS()` の第2引数に渡す。
3. **エラーハンドリング**: GAS通信失敗時は `alert()` ではなく `showToast()` または画面内エリアに理由を表示し、フリーズしない設計にする。`executeGAS` のタイムアウトは90秒。
4. **スプシ書き込みは手動一括同期**: Google Spreadsheet への追加・更新・削除は、操作時に `state` へ楽観反映し、`state.pendingSync` に積む。実際の通信は `syncPendingChanges()` のみで行う。
5. **未同期状態の可視化**: スプシ変更を保留する操作では、同期バーの件数更新に加え、対象行に「未同期」または「変更あり」バッジを表示する。削除は一覧から消し、同期バーに件数を残す。
6. **同期失敗時の保持**: `syncPendingChanges()` が失敗した場合、`state.pendingSync` を消してはならない。ユーザーが再度同期できる状態を維持する。
7. **スキーマ厳守**: データベーススキーマに**絶対に**従う。カラムの追加・削除・リネームは禁止。詳細は `schema.md` を参照。
8. **1ファイル構成**: CSSは `<style>`、JSは `<script>` タグ内に書き、外部ファイル化しない。

## 命名・スタイル

- **関数名**: `camelCase`（例: `batchPredictAI`, `handleStagingSave`）
- **ID・クラス名**: ケバブケース（例: `listContainer`, `stagingActions`）
- **Tailwindクラス**: 既存のUIコンポーネントのクラス構成を踏襲し、デザインの統一性を保つ。
  - カード: `bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100`
  - ボタン（プライマリ）: `bg-indigo-600 text-white font-bold py-4 px-10 hover:bg-indigo-700 active:scale-95 transition-all`
  - バッジ: `text-[9px] font-black px-2 py-0.5 rounded-full`

## 日付フォーマット

- 全ての日付は **YYYY-MM-DD**（ISO 8601）で統一。GAS側では `Utilities.formatDate(..., "yyyy-MM-dd")` を使う。
