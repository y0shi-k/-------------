---
id: TKT-0106-mobile-photo-capture-upload
title: スマホ写真取り込みと圧縮アップロード
status: ready_for_implementation
goal: スマホ/タブレットで直接写真を取り込み、圧縮して安全に保存できるようにする
acceptance:
  - `<input type="file" accept="image/*" capture="environment">` 相当の導線がある
  - 撮影/選択後にプレビューできる
  - 撮り直しできる
  - 長辺1024px程度に圧縮して保存する
  - Supabase Storageが公開バケットになっていない
  - Web版verifyが通る
required_evals:
  - photo_upload_storage
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/
  - supabase/
  - project-os/artifacts/TKT-0106/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0106-mobile-photo-capture-upload
related_artifacts:
  - artifacts/TKT-0106/verify.json
  - artifacts/TKT-0106/manual-smokes.md
  - artifacts/TKT-0106/review.md
  - artifacts/TKT-0106/report.md
owner_role: implementer
owner_notes:
  - TKT-0105完了後に実施する
  - iPhone SafariとAndroid Chromeで手動確認する
  - 完了後は TKT-0107 に進む
---

# Summary

写真取り込みチケット。AI解析の前に、撮影・プレビュー・圧縮・保存の土台を作る。

## 実装メモ

- 写真は個人情報を含む可能性があるため、非公開保存を標準にする。
- 画像圧縮はブラウザ側で行い、通信量を抑える。
- 失敗時は原因が分かる文言を画面内に出す。

## 次

TKT-0107-ai-ingredient-scan-api
