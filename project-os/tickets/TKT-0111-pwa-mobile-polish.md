---
id: TKT-0111-pwa-mobile-polish
title: PWA化とスマホUI仕上げ
status: ready_for_implementation
goal: Web版をスマホ/タブレットでアプリらしく使える状態に仕上げる
acceptance:
  - PWA manifestがある
  - ホーム画面追加後の表示を確認できる
  - 在庫、登録待ち、写真取り込み、レシピ、献立、料理履歴がスマホ幅で崩れない
  - タブレット幅で情報密度が不自然にならない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
  - photo_upload_storage
  - web_project_bootstrap
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0111/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0111-pwa-mobile-polish
related_artifacts:
  - artifacts/TKT-0111/verify.json
  - artifacts/TKT-0111/manual-smokes.md
  - artifacts/TKT-0111/review.md
  - artifacts/TKT-0111/report.md
owner_role: implementer
owner_notes:
  - TKT-0110完了後に実施する
  - 機能追加ではなく仕上げに集中する
  - 完了後は TKT-0112 に進む
---

# Summary

スマホ仕上げチケット。Web版の実用前に、日常操作の見やすさと押しやすさを確認する。

## 実装メモ

- 写真取り込みボタンは最重要導線として見つけやすくする。
- 文字やボタンが重ならないことを優先する。
- PWAは過剰なオフライン対応より、まずホーム画面追加と表示安定を優先する。

## 次

TKT-0112-production-release-checklist
