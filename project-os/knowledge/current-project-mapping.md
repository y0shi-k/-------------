# current-project-mapping

## 目的

この文書は、この案件（Stock Master）で使っている固有ルールを、汎用 `portable-harness` ではどう外したかを示す対応表です。

starter 本文へ現行案件固有の内容を戻さないための参照資料として使います。

## 対応表

| この案件の固有内容 | 汎用ハーネスでの扱い |
| --- | --- |
| `app.html` をフロント正本にする | `{{SOURCE_OF_TRUTH_PATHS}}` へ置き換える |
| GASデプロイ後のWebアプリ、Spreadsheetデータ、Drive画像を生成物にする | `{{GENERATED_FILES}}` へ置き換える |
| `python3 -c "import html.parser..."` を verify に使う | `{{VERIFY_COMMAND}}` へ置き換える |
| HTML構文 + 必須関数存在確認 | `{{STACK_SPECIFIC_EVALS}}` へ差し替える |
| GAS_URL、APIキー、SS_ID、食材データ | `{{SENSITIVE_DATA_RULES}}` として案件ごとに定義する |
| GASデプロイ、Spreadsheet手動編集、Driveアップロード | `{{DEPLOYMENT_BOUNDARY}}` として定義する |
| 単一HTMLファイル制約、Tailwind CDN、Vanilla JS | `{{STACK_SPECIFIC_EVALS}}` のマニュアルスモーク項目に含める |
| Phase1/2/3 のフェーズ管理 | `harness/change_evals.json` の `phase_transition` eval に分離する |

## この案件でコアとして残した考え方

- AI は `AGENTS.md` を入口にする
- 会話ではなく `project-os/` を状態の正本にする
- `spec + ticket + artifacts + phase_gates` で完了判定する
- AI 向けルールと人向け説明を分ける
- 不要ファイルはすぐ削除せず `.trash/` に退避する

## この案件だけに残したもの

- Canvasアプリの単一HTMLファイル制約
- GAS通信のJSONP + Form POST方式
- Google Spreadsheet の5シートスキーマ
- Gemini API連携パターン
- Phase別の実装ガイド
- Tailwind CSS の特定のクラス構成パターン

## 判断基準

次案件でも同じでよいものは starter へ入れます。
次案件で言い換えが必要なものはプレースホルダ化します。
この案件の業務や画面に依存するものは knowledge にだけ残します。
