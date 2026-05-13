# 技術スタックと絶対制約

| 層 | 技術 | 制約・注意 |
|---|---|---|
| **フロントエンド** | 単一HTMLファイル (`app.html`) | **1ファイルに全部書く**。外部JS/CSSファイルを分離しない。React等のフレームワークは使用しない（純粋なVanilla JS + DOM操作）。 |
| **スタイリング** | Tailwind CSS (CDN) | `https://cdn.tailwindcss.com` を `<head>` で読み込む。独自CSSは `<style>` タグ内に最小限のみ記述し、Tailwindのユーティリティクラスを優先して使う。 |
| **バックエンド** | Google Apps Script (GAS) | `GAS_URL` 定数にWebアプリURLをハードコード。通信は `executeGAS()` 関数を必ず通す。スプレッドシート書き込み系は手動一括同期だけで反映する。 |
| **データベース** | Google Spreadsheet（1ファイル・5シート） | スキーマ（カラム定義）は**厳密に固定**。勝手なカラム追加・削除・名前変更を**絶対に行わない**。 |
| **永続化** | `PropertiesService` (GAS) | スプレッドシートID (`SS_ID_RECIPE_APP`) を保存。GAS実行ごとにシートが増殖しないよう、初期化ロジックで存在確認を徹底する。 |
| **AI連携** | Gemini API | フロントエンドから直接呼ぶ場合はAPIキー管理に注意。可能であればGAS側でプロキシし、キーを隠蔽する設計を推奨。 |

## Canvasアプリ特有の絶対制約

- **単一ファイル構成**: HTML・CSS・JSを全て `app.html`（HTMLとして解釈される）に内包する。
- **ローカルストレージ不使用**: ブラウザの `localStorage` 等には頼らず、ソース・オブジェクト・画像は全てGAS/Spreadsheet/DriveAppで管理する。
- **DOMベースの状態管理**: React等の仮想DOMは使わない。`state` オブジェクト（Plain Object）をグローバルに持ち、`renderList()` 等の関数で都度DOMを書き換える。
- **GAS通信はJSONP + Form POST**: CORSの都合上、直接 `fetch` でGASへPOSTせず、`executeGAS()` 内の「フォーム送信 + コールバックポーリング」方式を使う。これを改変しないこと。
- **スプシ変更は手動一括同期**: `handleInit()` の初期読込/DB初期化と `approveAllAndInit()` の承認を除き、Google Spreadsheet への追加・更新・削除は操作時に即時通信しない。UIは `state` へ楽観反映し、`state.pendingSync` に保留変更を積み、ユーザーが「同期する」を押した時だけ `syncPendingChanges()` から1回の `executeGAS()` で反映する。
- **個別書き込みGAS禁止**: 新規機能ごとに `saveXxx` / `updateXxx` / `deleteXxx` などの個別 `executeGAS(payload...)` を増やしてはならない。書き込みGASペイロードは `syncPendingChanges()` に集約する。
- **APIキー自動提供**: Canvas内でGemini API等を呼ぶ際、システムが裏側でキーを自動補完する。そのため `if (!API_KEY)` のような空チェックを入れると処理がブロックされる。空文字 `""` で定義し、バリデーションを入れない。
- **標準UIダイアログ禁止**: `alert()`, `confirm()`, `prompt()` はCanvasのiframe sandboxでブロックされ、プレビュー画面がフリーズする。既存の `showToast()` を使用する。
- **コード肥大化抑制**: `app.html` は単一ファイルのまま維持するため、実装時は以下を徹底する。
  - 既存の共通関数・スタイル・パターンを最大限再利用する（DRY）。
  - 新規CSSアニメーションやユーティリティは、既存のTailwindクラスで代替できないか最優先で検討する。
  - 新規DOM構造（モーダル等）は、既存の `itemModal` 等を流用・拡張する方向で設計する。
  - 機能追加ごとに無闇な行数増加を避け、スリムな実装を心がける。
