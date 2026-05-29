---
name: verify
description: Web版のverify（lint/typecheck/test/build + GAS漏れ・秘密直書き・RLSのpolicyチェック）を実行し、verify.json artifactを残す。コード変更後の確認に使う。Canvas版app.htmlは凍結・参照専用のため対象外。
---

# /verify — Web版 verify を実行

`harness/bin/verify_web.sh` を実行する。引数の TKT があれば `project-os/artifacts/<TKT>/verify.json` に結果を残す。

## 手順
1. 引数から TKT を取得（例: `TKT-0143`）。無ければユーザーに確認するか、git ブランチ名から推定する。
2. 次を実行する:
   ```bash
   bash harness/bin/verify_web.sh <TKT-xxxx>
   ```
3. 出力（lint/typecheck/test/build と policy: no_gas_dependency / no_hardcoded_secret / supabase_rls_present）を要約して報告する。
4. `VERIFY_FAILED` の場合は、失敗ステップと `details`（gas_hits / secret_hits / rls_note）を示し、根本原因を調べて修正する。テストやチェックを無効化して通すことはしない。

## 注意
- verify コマンドの正本はこのスクリプトと `harness/registry.json`。他ファイルに直書きしない。
- build が重い場合でも省略しない。失敗時は原因を特定して直す。
