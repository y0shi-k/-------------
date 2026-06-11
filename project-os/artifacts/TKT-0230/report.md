---
ticket_id: TKT-0230-approval-gate-routing
status: ready
---

# Report Draft

## 変更目的

承認制ログイン（SPEC-0228 ③/⑥）の実効性の本体。TKT-0228/0229 の時点では「ログインできれば
データ画面に入れる」穴が残っていた。ルーティングを4状態（unauthenticated/pending/disabled/approved）
へ拡張し、未承認・停止ユーザーを `/pending` に固定して、在庫・レシピ・写真・AI API への到達を
middleware／サーバー側で遮断した。

## 今回追加した安全装置

- `getAuthRedirectPath(pathname, state)` の4状態化（純関数・テスト23ケースで全分岐固定）:
  pending/disabled は `/pending` と `/auth/*`（メールリンク処理）以外すべて `/pending` へ。
  approved は /login /signup /pending から `/` へ離脱（従来挙動維持）。
- `fetchAccountStatus`: profiles.status の行なし・取得エラー・未知値を**すべて pending に倒す**（安全側）。
- `/pending` ページ: middleware に加え page 側でも getUser／status を二重ガード。
  pending=「承認待ち」/ disabled=「利用停止中」の文言出し分け＋ログアウト導線。
- AI route（/api/ai/recipes・/api/ai/scan-ingredients）に多層防御: middleware matcher が
  覆っていることを確認した上で、route 側でも非 approved を 403（日本語エラー）で遮断。
  usage 予約・Gemini 送信より前に弾くため、未承認ユーザーが quota を消費しない。
- UIで隠すだけの実装ではない（middleware＋server component＋API route の3層）。

## 実施した確認

- `/verify TKT-0230`: lint / typecheck / test（494件） / build すべて pass（verify.json 参照）。
- 状態×パスの遷移表をレビューで突合（review.md 参照）。`/auth/*` 全状態素通し＝確認リンク・
  recovery リンクを壊さない設計意図を確認。
- オーケストレーターが routing.ts / account-status.ts / middleware.ts / pending/page.tsx /
  AI route ガードを全文レビュー。指摘なし。

## 残リスク

- Supabase 障害時（profiles 取得エラー）は承認済みユーザーも /pending に倒れる。
  安全側設計のトレードオフとして SPEC-0228 で許容済み（個人運用）。
- 毎リクエスト +1 クエリ（profiles）。SPEC で許容判断済み。
- hosted に TKT-0228 migration が未適用の環境では profiles 取得が失敗し全員 /pending になる。
  **本番デプロイは migration 適用（TKT-0233 ゲート）とセットで行うこと。**
- pending ユーザーの API fetch は経路により 307（HTML）か 403（JSON）に分かれるが、
  どちらでもデータ到達は阻止される（実害なし）。
- check-gates の photo/csv eval は作業ツリーの他チケット未コミット変更による過剰マッチ
  （本チケットの実変更は web/ のルーティング・ページ・APIガードのみ）。

## 次の依頼や人判断

- TKT-0231（管理者画面）の実装続行（承認操作ができて初めて pending を解除できる）。
- hosted 適用後の実機スモーク: pending/disabled/approved 3アカウントでの遷移確認（manual-smokes 参照）。
