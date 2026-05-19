# Verify and Gates

## verify の入口
- 全体確認: `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
- 監査が必要な時だけ: 現時点では未定

## verify が確認するもの
- 正本と生成物の整合
- HTML構文チェック、`executeGAS` と `GAS_URL` の存在確認
- `change_evals.json` に基づく manual smoke と artifact 要件
- ticket / spec / artifact 内容に基づく phase gate 判定

## 停止条件
- `spec_ready` と `implementation_ready` が揃う前の実装開始
- 生成物 drift の未解消
- HTML構文エラー
- `executeGAS` または `GAS_URL` の消失
- 初期読込/承認/`syncPendingChanges()` 以外で、スプシ書き込み・更新・削除を個別 `executeGAS(payload...)` している
- スプシ書き込み系の新規UIに未同期状態表示または手動同期導線がない
- 必須 policy check 失敗
- 監査が必要な変更で監査未実施または失敗

## phase gate の意味
- `spec_ready`: 関連 spec と acceptance がある
- `implementation_ready`: ticket の owner_role と required_evals がある
- `verify_passed`: verify artifact が保存されている
- `audit_checked`: 必要な変更で監査 artifact が保存されている
- `manual_smokes_done`: manual smoke artifact がある
- `review_ready`: reviewer artifact がある
- `report_ready`: ユーザー向け報告 artifact がある

## gate の運用ルール
- `spec_ready` が無い場合、AI は実装ではなく `spec` 作成または既存 spec 紐付けを先に行う
- `implementation_ready` が無い場合、AI は実装ではなく `ticket` 作成または required_evals 整備を先に行う
- `verify_passed` は `project-os/artifacts/TKT-xxxx/verify.json` が存在し、pass 条件を満たすまで閉じない
- `manual_smokes_done` は `project-os/artifacts/TKT-xxxx/manual-smokes.md` が存在し、status と必須 section を満たすまで閉じない
- `review_ready` は `project-os/artifacts/TKT-xxxx/review.md` が存在し、`checked_diff_paths` が ticket.changed_paths と対応するまで閉じない
- `report_ready` は `project-os/artifacts/TKT-xxxx/report.md` が存在し、status が `ready` になるまで閉じない

## 軽量UI調整時の gate 集約
- 同一セッションで同一画面・同一目的の小さなUI調整を繰り返す場合、新規 `TKT-*` / `SPEC-*` / artifact ディレクトリを小修正ごとに作らない。
- 直近の関連 ticket/spec があり、目的・scope・acceptance が引き続き妥当なら、それを更新または追記して使う。
- artifact は同じ `project-os/artifacts/TKT-xxxx/` の `verify.json` / `manual-smokes.md` / `review.md` / `report.md` を最後にまとめて更新する。
- 途中の小修正ごとに full verify を実行しなくてよい。ただし HTML/JS 構文破損が疑われる大きめの編集後は、軽い構文チェックをその場で実行してよい。
- ユーザーがブラウザテストを実施すると明示した場合、AI は静的 verify と manual smoke 手順記録まででよい。
- 以下は軽量UI調整に含めてよい:
  - 同一画面内のレイアウト調整
  - 表示件数、折り返し、省略、tooltip、hover 表示の調整
  - 文言、ラベル、CSSクラス、Tailwindクラスの調整
  - 既存 state / 保存形式を変えない描画ロジックの小変更
- 以下は軽量集約の対象外で、従来どおり個別 ticket と full gate を使う:
  - Spreadsheet スキーマ変更
  - GAS通信方式や `executeGAS` 周辺変更
  - `pendingSync` / `syncPendingChanges()` / 保存形式の変更
  - データ削除、移行、破壊的変更
  - 複数画面にまたがる機能追加や契約変更

## スプシ同期 policy check
- Google Spreadsheet の追加・更新・削除を含む変更では、`required_evals` に `manual_bulk_sync_policy` を含める
- `rg -n 'executeGAS\\(payload' app.html` で、書き込み系の個別通信が増えていないことを確認する
- `rg -n 'appendRow|deleteRow|setValue|setValues|SpreadsheetApp' app.html` で、書き込みGASが `handleInit()` または `syncPendingChanges()` に収まっていることを確認する
- manual smoke では `manual_bulk_sync` を実施し、操作直後はスプシ未反映、同期ボタン後に反映されることを確認する
