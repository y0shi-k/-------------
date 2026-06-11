---
ticket_id: TKT-0231-admin-user-management
status: passed
review_scope:
  - SPEC-0228-production-auth-onboarding
  - TKT-0231-admin-user-management
---

# Review Record

## checked_diff_paths

- web/src/app/admin/page.tsx（新規。サーバー側 getUser→role 判定→redirect、admin のみ全行取得）
- web/src/lib/auth/admin-profiles.ts（新規。AdminProfile/AdminAction 型・buildStatusUpdate 純関数）
- web/src/components/admin-user-board.tsx（新規・250行。申請/全ユーザー一覧・確認パネル・自己操作抑止）
- web/src/lib/auth/account-status.ts（fetchAccountRole 追加。失敗→member の安全側）
- web/src/app/page.tsx（isAdmin を WebModeShell へ）
- web/src/components/web-mode-shell.tsx・settings-panel.tsx（admin 限定導線。主ナビ非昇格=IA方針どおり）
- web/src/app/globals.css（admin-* スタイル）
- web/src/__tests__/admin-user-board.test.tsx・account-status.test.ts（追加）

## checked_artifacts

- project-os/artifacts/TKT-0231/verify.json（status=pass・テスト505件）
- project-os/artifacts/TKT-0231/manual-smokes.md（static_only・実機消化は hosted 適用後）
- project-os/specs/completed/SPEC-0228-production-auth-onboarding.md（「承認の書き込み経路」と一致）

## subagent_usage

- 実装: impl-deep（Opus）。オーケストレーター（メインセッション）は委譲・監査のみ。
- レビュー: メインセッションが admin/page.tsx・admin-profiles.ts・update 呼び出し部を確認。

## findings

1. **[確認済み・重要]** TKT-0228 review.md からの引き継ぎ事項「admin update ポリシーの列単位制御不可は
   UI ガードで担保」を確認: 更新 payload は `buildStatusUpdate` の status/approved_at/approved_by のみで、
   role・email を送る経路がコード上存在しない。テストで payload キーを固定済み。
2. **[確認済み]** 権限判定がサーバー側（page.tsx redirect）。クライアント isAdmin は導線表示のみで、
   アクセス制御に使われていない（「UIで隠すだけにしない」要求充足）。
3. **[確認済み]** service role key 不使用（grep で SERVICE_ROLE 参照なし）。anon key＋セッション＋RLS のみ。
4. **[確認済み]** 自己操作の二重抑止（描画抑止＋実行時 early return）で admin の自己締め出しを防止。
5. **[確認済み]** 拒否/無効化は確認パネル経由。エラーは日本語フィードバック。イミュータブル更新。
6. **[許容・低]** devtools を使う悪意 admin の role 直接 update は技術的に可能。admin=信頼ロール前提
   （個人運用で admin は本人のみ）であり、昇降格は Dashboard/SQL 限定と runbook に明記する運用で許容。
7. **[指摘なし]** 今回はオーケストレーター修正なし。

## open_risks

- 実機での RLS 実挙動（member の他人行 update 拒否）は hosted 適用後スモークで確認（manual-smokes）。
- 承認通知メールなし・一覧ページングなし（非ゴール。利用者増で別チケット）。

## verdict

passed — SPEC-0228「承認の書き込み経路」（RLS直更新・service role 不使用）どおり。
0228 から引き継いだ列制限リスクへの UI 側担保を確認し、権限判定・自己操作抑止も多層で実装されている。
