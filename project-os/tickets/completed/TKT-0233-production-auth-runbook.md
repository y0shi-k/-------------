---
id: TKT-0233-production-auth-runbook
title: 認証本番化の適用 runbook＋E2E手動スモーク手順
status: completed
goal: 本番 Supabase/Vercel への適用漏れ（Dashboard設定・migration・初代admin）で「コードはあるが本番で動かない」事故を防ぐ
acceptance:
  - docs/runbook/ に認証本番化の適用手順が揃っている（番号付き・コピペ可能なSQL/設定値。秘密情報の実値は書かない）
  - 手順に以下が含まれる: ① migration 適用（TKT-0228 を含む未適用一覧の確認方法と `supabase db push`）② Dashboard Auth 設定（signup 有効化・メール確認必須・site_url / redirect URLs に本番ドメインの /auth/confirm）③ 初代 admin 昇格 SQL ④ SMTP（Resend等）移行手順の概要 ⑤ ロールバック方針（signup を Dashboard で即時閉じる手順）
  - E2E手動スモークのチェックリストがある（新規申請→メール確認→pending固定→admin承認→利用開始→パスワードリセット→無効化、の一連）
  - 既存 runbook（TKT-0149 作成分）と重複せず、相互参照されている
  - Web版 verify が通る（docsのみでコード無変更であることを report に記録）
required_evals:
  - web_project_bootstrap
eval_selection_mode: manual
changed_paths:
  - docs/runbook/
  - project-os/artifacts/TKT-0233/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0228-production-auth-onboarding
related_artifacts:
  - artifacts/TKT-0233/verify.json
  - artifacts/TKT-0233/report.md
owner_role: implementer
owner_notes:
  - 非危険（docsのみ）。ただし手順の対象は危険変更の適用なので、実際の本番適用作業はユーザーが runbook に沿って実施し、結果を TKT-0228〜0232 の manual-smokes に反映する
  - APIキー・パスワード・個人メールの実値を docs に書かない（プレースホルダ表記）
  - required_evals は paths 整合のための名目（web_project_bootstrap）。docsのみで実コード無変更と report に記録する
---

# Summary

TKT-0228〜0232 の成果を本番（hosted Supabase + Vercel）で有効にするための運用手順書。
backlog P1「公開前の本番適用ゲート」（TKT-0149/0151/0212 の未適用分）とも整合させ、適用順を1本にまとめる。

## 実装メモ

- 既存 runbook の場所と体裁を踏襲: `docs/runbook/`（TKT-0149 が Supabase Dashboard 手順を作成済み。重複は相互参照で解消）
- backlog.md「次にやる候補 P1」に記載の未適用 migration（`ai_usage_events`、`20260609120000_shopping_items_meal_schedule_link.sql`）と
  TKT-0228 の profiles migration をまとめた適用チェックリストにする
- 初代 admin SQL は `update public.profiles set role='admin', status='approved' where email='<管理者メール>';` 形式（実値なし）
- SMTP 移行は手順の概要＋公式docsへのリンクで足りる（実設定は非対象）
- スモーク手順は TKT-0228〜0232 各チケットの「手動確認」節を1本のシナリオに統合する

## 非ゴール

- 本番への適用作業そのもの（ユーザー実施。コード/migrationの変更もしない）
- 独自SMTPの実設定・ドメイン取得
- CSP強化など認証以外のセキュリティ項目（backlog P2 で別管理）

## 依存チケット

- TKT-0228〜TKT-0232（全実装完了後に手順を確定する。骨子の先行執筆は可）

## 残リスク

- runbook は書いた時点の Dashboard UI 名称に依存する。適用時に画面名が変わっていたら都度更新する
