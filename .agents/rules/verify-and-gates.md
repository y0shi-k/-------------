# Verify and Gates

> 対象は Web版（`web/` + `supabase/`）。**Canvas版 `app.html` は凍結・参照専用**で verify 対象外。

## verify の入口
- 正本は `harness/registry.json` と `harness/bin/verify_web.sh`（`/verify` Skill）。コマンドを他ファイルに直書きしない。
- `/verify` の中身: web の lint / typecheck / test / build と policy チェック（GAS漏れ・秘密直書き・RLS）。コマンドの実体は `harness/registry.json` と `harness/bin/verify_web.sh`。
- 監査が必要な時だけ: 現時点では未定
- Canvas版 verify は凍結済みのため参照のみ（`harness/registry.json` の `legacy_reference`）。

## verify が確認するもの
- 正本と生成物の整合
- Web版の lint / 型チェック / テスト / build
- policy: GAS/Spreadsheet/Drive 依存の混入が無いこと、秘密の直書きが無いこと、個人データテーブルに RLS があること
- `change_evals.json`（active のみ）に基づく manual smoke と artifact 要件
- ticket / spec / artifact 内容に基づく phase gate 判定（`/check-gates`）

## 停止条件
### 共通
- `spec_ready` と `implementation_ready` が揃う前の実装開始
- 生成物 drift の未解消
- 必須 policy check 失敗
- 監査が必要な変更で監査未実施または失敗

### Web版
- APIキー、Supabase秘密鍵、DBパスワードの直書き
- Supabase RLS未設定のまま個人データを扱う
- ログインなしで個人データを閲覧できる
- Supabase Storageで写真を公開バケットに保存する
- `npm run build` 失敗
- Gemini APIをブラウザから直接呼び、APIキーが露出する

### Canvas版（凍結・参照のみ）
- Canvas版は編集しないため停止条件の対象外。過去のCanvas停止条件は `harness/change_evals.json` の reference eval を参照。

## phase gate の意味
- `spec_ready`: 関連 spec と acceptance がある
- `implementation_ready`: ticket の owner_role と required_evals がある
- `verify_passed`: verify artifact が保存されている
- `audit_checked`: 必要な変更で監査 artifact が保存されている
- `manual_smokes_done`: manual smoke artifact がある
- `review_ready`: reviewer artifact がある
- `report_ready`: ユーザー向け報告 artifact がある

## 必須成果物（軽量化された既定）
- **既定の必須成果物は `verify.json` + `report.md` の2つ**。非危険な変更はこれだけで完了可能。
- `manual-smokes.md` / `review.md` は **`change_evals.json` の `danger: true` eval に該当する変更でのみ必須**:
  `supabase_schema_change` / `auth_and_rls_policy` / `photo_upload_storage` / `ai_server_route` / `csv_import_migration`、
  およびデータ削除・移行を伴う変更。
- どの gate が必要かは各 eval の `phase_gate_tags` が正本。`/check-gates` が diff から自動判定する。

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

## スプシ同期 policy check（Canvas・参照のみ）
- Canvas版は凍結のため対象外。過去のスプシ手動一括同期ポリシーは `harness/change_evals.json` の reference eval `manual_bulk_sync_policy` を参照。

## Web版 policy check（`/verify` に自動化済み）
- 以下は `harness/bin/verify_web.sh` が自動実行する。手動で再掲する必要はない。
- Web版の新規コードでは `required_evals` に対象に応じて `web_project_bootstrap`, `supabase_schema_change`, `auth_and_rls_policy`, `photo_upload_storage`, `ai_server_route`, `csv_import_migration`, `pwa_mobile_ui` を含める（`/check-gates` が自動判定）。
- GAS/Spreadsheet/Drive 依存（`GAS_URL|executeGAS|SpreadsheetApp|DriveApp`）が `web/`/`supabase/`/`scripts/` に入っていないこと。
- 秘密（`GEMINI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_PASSWORD`）の実値直書きが無いこと。変数名だけの参照は許容。
- Supabase migration で、個人データを持つテーブルに RLS と本人制限 policy があること。

## 依存関係 security check
- npm / Python / 外部CLI などの依存関係を追加・更新・削除する変更では、`required_evals` に `dependency_security_check` を含める。
- 実行前にユーザー許可を得たことを artifact に残す。
- npm変更では `web/.npmrc` の `save-exact=true` と `package-lock.json` の存在を確認する。
- npm変更では `npm audit --audit-level=high` を実行し、結果を artifact に残す。
- Python変更では直接依存のバージョン固定、lockfile、または hash 固定方針を確認する。
- Python変更では `python3 -m pip check` を実行し、結果を artifact に残す。
- 依存関係ファイル（`package.json`, `package-lock.json`, `.npmrc`, `requirements.txt`, `pyproject.toml`, `uv.lock`, `Pipfile.lock`, `poetry.lock` など）の差分を確認し、意図しない更新がないことを review に書く。
