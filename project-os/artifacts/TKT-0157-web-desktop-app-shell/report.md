# TKT-0157 Report

## Summary

PC幅（1024px以上）向けに、左サイドバー、上部バー、広幅コンテンツのデスクトップシェルを追加した。スマホ幅では既存の上部ステータスバー、下部ナビ、660px中央列を維持する。

## Changes

- `WebModeShell` にPC用の `(group, leaf)` 選択状態と `useShellSubView()` を追加した。
- PCサイドバーにホーム枠、3グループ配下のleaf、設定枠を追加した。
- PC上部バーにアプリ名、検索スロット、AI残り回数、アカウント、ログアウト導線、ステータス表示を追加した。
- `@media (min-width: 1024px)` でのみ `.web-app-shell` を広幅シェルへ切り替えるCSSを追加した。
- `web-mode-shell.test.tsx` にPCシェルとサブビュー状態のテストを追加した。

## Verification

- `npm run test -- web-mode-shell.test.tsx`: pass
- `harness/bin/verify_web.sh TKT-0157-web-desktop-app-shell`: pass
  - lint: pass
  - typecheck: pass
  - test: pass
  - build: pass
  - no GAS dependency: pass
  - no hardcoded secret: pass
  - Supabase RLS present: pass

## Manual Check

- `http://localhost:3001` でログイン画面の表示を確認した。
- ログイン後の目視確認は未実施。理由は、既存のログインスモークがSupabase Service Roleでリモート認証ユーザーを作成/更新する可能性があり、安全審査で止まったため。

## Security

- APIキー、Service Role Key、写真URLの直書きは追加していない。
- Supabase schema、RLS、Storage、AI route は変更していない。
