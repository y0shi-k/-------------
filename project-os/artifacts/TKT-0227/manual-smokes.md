---
ticket_id: TKT-0227-user-synonym-dictionary-settings
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
  - supabase_schema_change
  - photo_upload_storage
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui（チケットの required_evals。非危険）
- supabase_schema_change / photo_upload_storage は作業ツリー上の他チケット diff 語彙による自動マッチ。本チケットは localStorage＋クライアントロジック＋設定UIのみで、schema・Storage の挙動変更はない。

## executed_checks

- ユニットテスト（vitest 415件全パス、新規27件）で次を確認:
  - parse: 区切り4種（＝/=/、/,）・trim・空語除去・2語未満の行無視・空行無視・format との往復。
  - load/save: localStorage への JSON 保存・復元・型検証フォールバック。
  - 即時反映: save 直後に `matchesIngredientName` が true / score=2、空保存で false に戻る（解除）。
  - 静的辞書の挙動不変（既存56件の name-match テスト含む）。
  - 設定UI: セクション表示・入力→保存→localStorage 反映・有効グループ数フィードバック。
- コードレビューで `supabase/` 配下・schema・Storage・API キーの取り扱いに変更がないことを確認（保存先は端末内 localStorage のみ、秘匿情報なし）。

## skipped_checks

- 実機・実ブラウザでの設定画面目視（textarea の見え方・保存→消費量調整での反映の体感）。ロジックはテストで担保済みで、データはローカル設定のみのため静的確認で足りると判断。

## open_risks

- 端末間同期なし（仕様上の制約）。実機での UI 微調整が必要になる可能性はあるが CSS 単独で対応可能。
