# Verify and Gates

## verify の入口
- 全体確認: `{{VERIFY_COMMAND}}`
- 監査が必要な時だけ: `{{OPTIONAL_AUDIT_COMMAND}}`

## verify が確認するもの
- 正本と生成物の整合
- build / syntax / marker / policy check
- `change_evals.json` に基づく manual smoke と artifact 要件
- ticket / spec / artifact 内容に基づく phase gate 判定

## 停止条件
- `spec_ready` と `implementation_ready` が揃う前の実装開始
- 生成物 drift の未解消
- 構文確認失敗
- 重要マーカー確認失敗
- 必須 policy check 失敗
- 監査が必要な変更で監査未実施または失敗

## phase gate の意味
- `spec_ready`: 関連 spec と acceptance がある
- `implementation_ready`: ticket の owner_role と required_evals がある
- `verify_passed`: verify artifact がある
- `audit_checked`: 必要な場合に audit artifact がある
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
