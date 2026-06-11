---
id: TKT-0237-pwa-app-icon
title: ホーム追加時のPWAアプリアイコンを買い物かご案で設定する
status: in_progress
goal: スマホやタブレットでWeb版をホーム画面に追加したとき、Stock Master用の買い物かごアイコンが表示されるようにする。
acceptance:
  - `web/public/icons/` に買い物かご + 食材のアイコン画像が保存されている
  - PWA manifest で 192px / 512px のアイコンが参照されている
  - iOS向け apple touch icon が参照されている
  - Next.js metadata で manifest / icon / apple icon が参照されている
  - 既存画面・認証・DB・Storage・AI route の挙動を変えない
  - Web版 verify が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - .gitignore
  - web/public/icons/
  - web/public/manifest.json
  - web/src/app/layout.tsx
  - project-os/specs/SPEC-0237-pwa-app-icon.md
  - project-os/artifacts/TKT-0237/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0237-pwa-app-icon
related_artifacts:
  - artifacts/TKT-0237/verify.json
  - artifacts/TKT-0237/report.md
owner_role: implementer
owner_notes:
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
  - 秘密情報・APIキーは追加しない
  - Service Worker / オフライン対応は本チケットでは扱わない
---

# Summary

生成済みの案2「買い物かご + 食材」アイコンをWeb版のホーム追加用アイコンとして設定する。

## 実装メモ

- 画像は `web/public/icons/` に保存する。
- `manifest.json` で `icons` を定義する。
- `layout.tsx` の metadata に `manifest` と `icons` を追加し、iOS / Android の両方で参照されやすくする。

## 非ゴール

- アイコンデザインの再生成。
- PWAのオフライン対応。
- DB / Auth / RLS / Storage / AI route の変更。

## 残リスク

- ホーム画面アイコンは端末・ブラウザのキャッシュが強いため、既に追加済みの場合は一度削除して追加し直す必要がある。
