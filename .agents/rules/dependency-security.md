# Dependency Security

外部ライブラリや開発ツールは、npm / Python / CLI などの種類に関係なく、依存関係として扱う。
便利さだけで追加せず、追加前の確認、ユーザー許可、バージョン固定、変更後の記録を必須にする。

## 対象

- Node.js: `npm install`, `npm update`, `npm audit fix`, `npx`
- Python: `pip install`, `pip install --upgrade`, `python3 -m pip install`, `uv add`, `poetry add`
- その他: GitHub Actions、外部CLI、コード生成ツール、GitHub URL / tarball / CDN 由来の依存

## 絶対ルール

- 依存関係の追加・更新・削除は、実行前にユーザー許可を得る。
- `npm update`, `npm audit fix`, `pip install --upgrade` などの一括更新は、個別に理由と影響を説明してから許可を得る。
- 自動アップデート、自動マージ、自動修正は使わない。Dependabot / Renovate を使う場合も自動マージは禁止する。
- APIキー、`.env.local`、本番認証情報がある状態で、出所不明のinstallやscript実行をしない。
- GitHub直指定、短縮URL、個人配布tarball、出所不明CDNからの導入は原則禁止する。必要な場合はticketに理由を残す。
- 追加した依存関係は、ticket artifact に「追加理由」「確認した情報」「verify結果」を残す。

## 追加前チェック

外部依存を追加する前に、以下を確認する。

- その依存が本当に必要か。標準機能や既存依存で代替できないか。
- パッケージ名が本物か。typo-squatting ではないか。
- npm / PyPI などの公式ページ、GitHubリポジトリ、作者、更新日、利用状況を確認したか。
- 既知の脆弱性、マルウェア報告、メンテナンス停止がないか。
- インストール時に動くscriptやビルド処理があるか。
- 依存先が過度に多くないか。

最新情報が必要な場合は `dependency-security-review` skill を使い、OSV、GitHub Advisory、npm / PyPI 公式情報などを確認する。

## npm ルール

- `web/.npmrc` で `save-exact=true` を使い、直接依存は固定バージョンで保存する。
- `package-lock.json` を必ず正本として扱い、削除しない。
- 通常の再現インストールは `npm ci` を使う。
- 新規追加は許可後に `npm install <package> --save-exact` 相当で実行する。
- `package.json` の直接依存に `^` や `~` を増やさない。
- 依存追加・更新後は `npm audit --audit-level=high` と通常のWeb版verifyを行う。

## Python ルール

- Python依存を導入する場合は、まず対象ticketで管理方式を決める。
- `requirements.txt` を使う場合、直接依存は `package==1.2.3` のように固定する。
- lockfileを使うツールでは lockfile を正本にする。
- 将来的に再現性が必要なスクリプトでは、`pip install --require-hashes -r requirements.txt` を検討する。
- 依存追加・更新後は `python3 -m pip check` を実行する。監査ツールを導入済みの場合はその結果も残す。

## 記録

依存関係を変更したticketでは、`project-os/artifacts/TKT-xxxx/` に以下を残す。

- 追加・更新・削除した依存名とバージョン
- 採用理由
- 代替案を検討した結果
- セキュリティ確認結果
- lockfile差分の確認結果
- 実行したverify / audit結果
