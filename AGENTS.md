# AGENTS.md — Stock Master（料理レシピ・食材管理アプリ）

> このファイルは、このリポジトリで作業する AI 向けの唯一の入口です。詳細は `.agents/` と `project-os/`、人向け文書は `docs/` を参照してください。

---

## 最優先ルール

- 既存機能を壊さない
- **正本と生成物の境界を守る**（詳細は `.agents/rules/source-of-truth.md`）
- 実装前に関連する `project-os/tickets/TKT-*` が存在し `implementation_ready` であることを確認する
- `spec_ready` と `implementation_ready` が揃うまで実装へ入らない
- 変更後は verify を実行する
- 完了判定は `spec + ticket + artifacts + phase_gates` で行う

---

## プロジェクト概要

- **名称**: Stock Master — 料理レシピ・食材管理アプリ
- **形式**: Canvasアプリ（単一HTMLファイルをGAS Webアプリとしてホスト）
- **現状フェーズ**: Phase 1（DB構築 ＋ モードA：インベントリ・買い物リスト）実装中。Phase2/3未実装。
- **設計思想**: スマホファースト、オフライン気味の操作性、GAS通信時のUXストレス軽減

---

## 技術スタックと絶対制約

| 層 | 技術 | 制約・注意 |
|---|---|---|
| **フロントエンド** | 単一HTMLファイル (`app.html`) | **1ファイルに全部書く**。外部JS/CSSファイルを分離しない。React等のフレームワークは使用しない（純粋なVanilla JS + DOM操作）。 |
| **スタイリング** | Tailwind CSS (CDN) | `https://cdn.tailwindcss.com` を `<head>` で読み込む。独自CSSは `<style>` タグ内に最小限のみ記述し、Tailwindのユーティリティクラスを優先して使う。 |
| **バックエンド** | Google Apps Script (GAS) | `GAS_URL` 定数にWebアプリURLをハードコード。通信は `executeGAS()` 関数を必ず通す。 |
| **データベース** | Google Spreadsheet（1ファイル・5シート） | スキーマ（カラム定義）は**厳密に固定**。勝手なカラム追加・削除・名前変更を**絶対に行わない**。 |
| **永続化** | `PropertiesService` (GAS) | スプレッドシートID (`SS_ID_RECIPE_APP`) を保存。GAS実行ごとにシートが増殖しないよう、初期化ロジックで存在確認を徹底する。 |
| **AI連携** | Gemini API | フロントエンドから直接呼ぶ場合はAPIキー管理に注意。可能であればGAS側でプロキシし、キーを隠蔽する設計を推奨。 |

### Canvasアプリ特有の制約
- **単一ファイル構成**: HTML・CSS・JSを全て `app.html`（HTMLとして解釈される）に内包する。
- **ローカルストレージ不使用**: ブラウザの `localStorage` 等には頼らず、ソース・オブジェクト・画像は全てGAS/Spreadsheet/DriveAppで管理する。
- **DOMベースの状態管理**: React等の仮想DOMは使わない。`state` オブジェクト（Plain Object）をグローバルに持ち、`renderList()` 等の関数で都度DOMを書き換える。
- **GAS通信はJSONP + Form POST**: CORSの都合上、直接 `fetch` でGASへPOSTせず、`executeGAS()` 内の「フォーム送信 + コールバックポーリング」方式を使う。これを改変しないこと。

---

## 開始前ゲート

- `非 trivial` な変更は、実装前に `project-os/specs/SPEC-*` と `project-os/tickets/TKT-*` を作成または既存選択する
- `非 trivial` とは、repo-tracked な変更、挙動変更、検証付き修正、review を要する変更を指す
- `spec_ready` と `implementation_ready` が揃っていない場合、AI は実装ではなく `spec/ticket` 整備を先に行う
- 読み取り専用の調査、単純質問、既存文書の要約はこのゲートの対象外
- 完了報告は会話だけで閉じず、`project-os/artifacts/TKT-xxxx/` に必要 artifact を残してから行う

---

## 正本ファイル

- **プロジェクト名**: Stock Master（料理レシピ・食材管理アプリ）
- **正本**:
  - `app.html` — フロントエンド全体（単一HTMLファイル）
  - `要件定義書.md` — 詳細仕様書（機能要件・データスキーマ・フェーズ計画）
  - `AGENTS.md` — 本ファイル（エージェント制約・規約書）
  - `.agents/` — AI向け運用ルール
  - `harness/*.json` — 機械可読な判定基準
- **生成物**:
  - GASデプロイ後のWebアプリ（HTMLをGASへアップロードしたもの）
  - Google Spreadsheet 内のデータ（スキーマは正本で管理）
  - Google Drive へ保存された画像ファイル（料理履歴写真等）
- **verify**: `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
- **任意監査**: 現時点では未定（Phase2以降で必要に応じて設定）
- **ハーネス設定**: `harness/registry.json`
- **eval 設定**: `harness/change_evals.json`
- **phase gate 定義**: `harness/phase_gates.json`

---

## まず見る文書

- AI ハーネス入口: `.agents/index.md`
- 状態基盤の入口: `project-os/index.md`
- 人向け文書の目次: `docs/index.md`
- 人向け導入手順: `docs/runbook/導入手順.md`

---

## 安全ルール

- **外部共有しないもの**:
  - `GAS_URL`（WebアプリURL）
  - Gemini APIキー（現状 `batchPredictAI` 内で空文字だが、実運用時はGAS側で隠蔽）
  - `SS_ID_RECIPE_APP`（Google Spreadsheet ID）
  - ユーザーの食材データ・買い物履歴・料理記録
- **実行境界**:
  - GAS Webアプリへのデプロイ・公開設定変更は明示依頼がある場合だけ実行する
  - Google Spreadsheet の手動編集（特にスキーマ変更）は絶対に行わない
  - Google Drive へのファイルアップロードは明示依頼がある場合だけ実行する
  - Gemini APIキーの露出・共有は行わない
- 破壊的操作、デプロイ、本番変更は明示依頼がある場合だけ実行する
- 不要ファイルを `rm` で即削除しない。削除候補はまず `.trash/` へ退避する

---

## 更新ルール

- AI ハーネス運用ルール変更時は `.agents/` も更新する
- 判定基準変更時は `harness/*.json` と必要な `project-os/` 記録も更新する
- 人向け運用ルール変更時は `docs/runbook/導入手順.md` も更新する
- `docs/temp/` の変更メモは、ユーザーが明示的に依頼した場合のみ新規作成する
- `docs/temp/` は追記ではなく、毎回新規ファイルを作る

---

## コーディング規約

### 必須ルール
1. **二重クリック防止**: GAS通信を伴う全ボタンは、通信中 `disabled` にする（`setStatus()` が自動で制御）。
2. **詳細なステータス表示**: 「処理中...」だけでなく、裏側で何をしているか具体的な日本語ラベルを `executeGAS()` の第2引数に渡す。
3. **エラーハンドリング**: GAS通信失敗時は `alert()` または画面内エリアに理由を表示し、フリーズしない設計にする。`executeGAS` のタイムアウトは90秒。
4. **スキーマ厳守**: データベーススキーマに**絶対に**従う。カラムの追加・削除・リネームは禁止。
5. **1ファイル構成**: CSSは `<style>`、JSは `<script>` タグ内に書き、外部ファイル化しない。

### 命名・スタイル
- **関数名**: `camelCase`（例: `batchPredictAI`, `handleStagingSave`）
- **ID・クラス名**: ケバブケース（例: `listContainer`, `stagingActions`）
- **Tailwindクラス**: 既存のUIコンポーネントのクラス構成を踏襲し、デザインの統一性を保つ。
  - カード: `bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100`
  - ボタン（プライマリ）: `bg-indigo-600 text-white font-bold py-4 px-10 hover:bg-indigo-700 active:scale-95 transition-all`
  - バッジ: `text-[9px] font-black px-2 py-0.5 rounded-full`

### 日付フォーマット
- 全ての日付は **YYYY-MM-DD**（ISO 8601）で統一。GAS側では `Utilities.formatDate(..., "yyyy-MM-dd")` を使う。

---

## データベーススキーマ（変更禁止）

初期化時に5シートを作成し、1行目に以下のヘッダーを**厳密に**設定すること。カラムの追加・削除・順序変更・名前変更は**禁止**。

### ① 食材在庫
| 列 | カラム名 | 型 | 備考 |
|---|---|---|---|
| A | `ID` | String (UUID) | `Utilities.getUuid()` で生成 |
| B | `分類` | String | 食材 / 調味料 |
| C | `品名` | String | |
| D | `数量` | Number | |
| E | `単位` | String | 個, g, ml, 本 など |
| F | `購入日` | String | YYYY-MM-DD |
| G | `開封日` | String | YYYY-MM-DD or 空 |
| H | `表示期限` | String | YYYY-MM-DD（パッケージ印字の賞味/消費期限） |
| I | `実質期限` | String | YYYY-MM-DD or 空（AI推測 or ユーザー設定） |
| J | `保存場所` | String | 冷蔵庫 / 冷凍庫 / パントリー / ベランダ / その他 |
| K | `状態メモ` | String | |

### ② レシピ集
| 列 | カラム名 | 型 | 備考 |
|---|---|---|---|
| A | `レシピID` | String (UUID) | |
| B | `レシピ名` | String | |
| C | `材料JSON` | String | `[{"name":"人参", "amount": 1, "unit": "本"}, ...]` |
| D | `手順JSON` | String | `["手順1", "手順2", ...]` |
| E | `出典` | String | URL or テキスト |
| F | `調理回数` | Number | 初期値0 |
| G | `調理日履歴` | String | JSON配列 `["YYYY-MM-DD", ...]` |

### ③ 献立スケジュール
| 列 | カラム名 | 型 | 備考 |
|---|---|---|---|
| A | `予定日` | String | YYYY-MM-DD |
| B | `食事区分` | String | 朝 / 昼 / 晩 / その他 |
| C | `レシピID` | String (UUID) | |
| D | `レシピ名` | String | |
| E | `ステータス` | String | 未完了 / 完了 |

### ④ 料理履歴
| 列 | カラム名 | 型 | 備考 |
|---|---|---|---|
| A | `履歴ID` | String (UUID) | |
| B | `調理日時` | String | YYYY-MM-DD HH:mm:ss |
| C | `レシピID` | String (UUID) | |
| D | `レシピ名` | String | |
| E | `感想` | String | |
| F | `写真URL` | String | DriveApp保存ファイルURL |
| G | `評価` | Number | 1〜5 |

### ⑤ 買い物リスト
| 列 | カラム名 | 型 | 備考 |
|---|---|---|---|
| A | `リストID` | String (UUID) | |
| B | `品名` | String | |
| C | `必要数量` | Number | |
| D | `単位` | String | |
| E | `ステータス` | String | 未購入 / 購入済 |
| F | `紐づくレシピ名` | String | |

---

## 機能実装ガイド（フェーズ別）

### Phase 1: インベントリ・買い物リスト（現在の実装範囲）
- [x] スプレッドシート初期化（5シート作成・ヘッダー設定）
- [x] 在庫一覧表示（保存場所タブ：すべて / 冷蔵庫 / 冷凍庫 / パントリー）
- [x] 買い物リストタブ（未購入アイテムのチェックボックス表示）
- [x] 登録待ち（Staging）リスト：手動追加 → 一括AI解析 → 一括DB登録のフロー
- [x] AI実質期限推測（Gemini API: `batchPredictAI`）
- [x] 購入済みアイテムの在庫へワンタップ移行（`bulkPurchase`）
- [ ] **未実装: ボトムナビゲーションバー**（モードB/C用の基礎UI）
- [ ] **未実装: 画像スキャン（Geminiマルチモーダル）からのAI一括登録**
- [ ] **未実装: 期限ハイライト（3日以内黄色、期限切れ赤色）**
- [ ] **未実装: 在庫数量の＋／－ワンタップ増減**

### Phase 2: 献立プランナー（未実装）
- レシピ集のCRUD（手動登録 + AIテキスト抽出構造化）
- 週間リストビュー形式の献立スケジュール（朝・昼・晩スロット）
- 在庫優先・指定食材によるAIレシピ考案
- 献立決定時の買い物リスト自動抽出 + モードAへのジャンプ導線

### Phase 3: クッキングビューア＆記録（未実装）
- デカ文字・大画面UI（緑系バッジ：食材、黄色系：調味料、赤：大さじ、青：小さじ）
- 完了後の消費量調整モーダル + 在庫減算
- 完成写真アップロード（DriveApp保存）+ 評価・感想記録
- 料理履歴追記 + 献立ステータス更新 + レシピ集の調理回数・日履歴更新

---

## 既知の技術的負債・TODO

- `GAS_URL` がソース内にハードコードされている。
- `batchPredictAI` 内の `apiKey` が空文字のまま。
- ボトムナビゲーションバー未実装（Phase2/3で必須）。
- Phase1で未実装の機能（期限ハイライト、数量増減、画像スキャン）が複数残存。
- `app.html` の拡張子は `.jsx` だが、中身は純粋なHTMLファイル。ビルドステップは不要。
