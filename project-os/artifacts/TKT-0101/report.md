---
ticket_id: TKT-0101-web-project-bootstrap
status: ready
---

# Report

## 変更目的

Web版開発を始められるように、`web/` にNext.js + TypeScriptの最小土台を作成した。

## 今回追加した安全装置

- `.env.example` は変数名だけにし、実値は入れていない。
- `.env*.local`, `.next/`, `.vercel/`, `coverage/` を `.gitignore` に追加した。
- Next.jsを脆弱性警告のない `15.5.18` に更新した。
- `postcss` は `overrides` で安全な `8.5.15` を使うようにした。

## 実施した確認

- `cd web && npm run lint && npm run typecheck && npm run test && npm run build`
- `cd web && npm audit --audit-level=moderate`
- Web版禁止依存の検索
- Codex内ブラウザで `http://localhost:3000` の初期表示を確認

## 残リスク

- Supabaseの実接続、ログイン、RLSは未実装。TKT-0102以降で扱う。
- 画像保存、AI API Route、業務データ表示は未実装。

## 次の依頼や人判断

次は `TKT-0102-supabase-project-and-env` でSupabaseプロジェクトと環境変数の準備へ進む。
