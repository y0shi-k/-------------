---
ticket_id: TKT-0230-approval-gate-routing
status: passed
review_scope:
  - SPEC-0228-production-auth-onboarding
  - TKT-0230-approval-gate-routing
---

# Review Record

## checked_diff_paths

- web/src/lib/auth/routing.ts（AuthState 4状態化・純関数維持）
- web/src/lib/auth/account-status.ts（新規。fetchAccountStatus／resolveAuthState・安全側 pending）
- web/src/lib/auth/pending-content.ts（新規。status→文言の純関数）
- web/src/lib/supabase/middleware.ts（getUser 後に resolveAuthState・4状態判定）
- web/src/app/pending/page.tsx（新規。page 側二重ガード＋LogoutButton 再利用）
- web/src/app/api/ai/recipes/route.ts・scan-ingredients/route.ts（非 approved を 403・usage 消費前）
- web/src/__tests__/（auth-routing 23ケース・account-status・pending-content 新規、AI route 403 追加）

## checked_artifacts

- project-os/artifacts/TKT-0230/verify.json（status=pass・テスト494件）
- project-os/artifacts/TKT-0230/manual-smokes.md（static_only・実機消化は hosted 適用後）
- project-os/specs/completed/SPEC-0228-production-auth-onboarding.md（「承認状態の判定位置」と一致）

## subagent_usage

- 実装: impl-deep（Opus）。オーケストレーター（メインセッション）は委譲・監査のみ。
- レビュー: メインセッションが routing.ts / account-status.ts / middleware.ts / pending/page.tsx /
  AI route ガードを全文確認。

## findings

1. **[確認済み]** 遮断は middleware＋server component＋API route の3層で、「UIで隠すだけ」になっていない
   （チケットの owner_notes の要求どおり）。
2. **[確認済み]** 安全側設計: profiles 行なし・取得エラー・未知 status → pending。fail-open になる経路なし。
3. **[確認済み]** `/auth/*` を全状態で素通しする設計は、承認待ち中のメール確認・recovery リンクを
   壊さないために必要（意図的な穴であり、`/auth/confirm` は token_hash 必須のため露出増なし）。
4. **[確認済み]** AI route の 403 は usage 予約（consumeAiUsage）より前＝未承認ユーザーによる
   quota 消費・Gemini 呼び出しなし。エラーメッセージは既存の「原因/影響/修正方法」形式に整合。
5. **[確認済み]** approved の従来挙動（redirect なし）維持をテストで固定。既存494件 pass で回帰なし。
6. **[指摘なし]** 今回はオーケストレーター修正なし。

## open_risks

- migration 未適用環境へのデプロイで全員 /pending 化（デプロイ順序の運用リスク）。TKT-0233 runbook の
  適用順チェックリストで担保する。
- Supabase 障害時の承認済みユーザー締め出し（SPEC 許容済みトレードオフ）。

## verdict

passed — SPEC-0228「承認状態の判定位置」の決定どおりの実装で、遮断が多層かつ fail-safe。
状態×パスの遷移表はチケット acceptance を満たし、全分岐がテストで固定されている。
