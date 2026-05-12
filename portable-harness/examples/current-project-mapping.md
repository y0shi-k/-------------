# current-project-mapping

## 目的

この文書は、この案件で使っている固有ルールを、汎用 `portable-harness` ではどこへ退避したかを示す対応表です。

starter 本文へ現行案件固有の内容を戻さないための参照資料として使います。

## 対応表

| この案件の固有内容 | 汎用ハーネスでの扱い |
| --- | --- |
| `assets/js/main.js` をフロント正本にする | `{{SOURCE_OF_TRUTH_PATHS}}` へ置き換える |
| `gas/Main.html` を生成物にする | `{{GENERATED_FILES}}` へ置き換える |
| `python3 tools/verify_repo.py` を verify に使う | `{{VERIFY_COMMAND}}` へ置き換える |
| `python3 tools/analyze_audit_log_csv.py` を監査に使う | `{{OPTIONAL_AUDIT_COMMAND}}` へ置き換える |
| 購入依頼、承認、PDF 保存、実購入入力 | `{{STACK_SPECIFIC_EVALS}}` と `{{MANUAL_SMOKE_ITEMS}}` に分離する |
| `project-os/knowledge/list-sync-policy.md` | 現行案件固有の知識として残し、starter には入れない |
| GAS 前提の build / syntax / marker | 各案件の verify へ差し替える |
| 個人情報、申請内容、監査ログ CSV | `{{SENSITIVE_DATA_RULES}}` として案件ごとに定義する |

## この案件でコアとして残した考え方

- AI は `AGENTS.md` を入口にする
- 会話ではなく `project-os/` を状態の正本にする
- `spec + ticket + artifacts + phase_gates` で完了判定する
- AI 向けルールと人向け説明を分ける
- 不要ファイルはすぐ削除せず `.trash/` に退避する

## この案件だけに残したもの

- GAS と HTML 再生成の運用
- 購入依頼ワークフローと承認フェーズ
- 一覧同期の詳細ポリシー
- 監査ログ CSV の分析しきい値
- この案件の UI invariant

## 判断基準

次案件でも同じでよいものは starter へ入れます。
次案件で言い換えが必要なものはプレースホルダ化します。
この案件の業務や画面に依存するものは examples にだけ残します。
