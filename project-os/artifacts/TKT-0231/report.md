---
ticket_id: TKT-0231-admin-user-management
status: ready
---

# Report Draft

## 変更目的

承認制ログイン（SPEC-0228 ④/⑥）。承認操作が Supabase Dashboard 頼みのままでは運用が回らないため、
admin ロール限定の `/admin` 画面を新設し、申請の承認/拒否・ユーザーの無効化/再有効化を
アプリ内で完結できるようにした。

## 今回追加した安全装置

- 権限判定は**サーバー側**（admin/page.tsx）: getUser → 非ログイン /login、`fetchAccountRole` で
  role!=='admin' は `redirect("/")`。クライアントの isAdmin はナビ表示の出し分けのみ。
- 書き込み経路は SPEC 決定どおり **RLS admin ポリシー直更新**（service role key 不使用）。
- 更新列は `buildStatusUpdate` の `{status, approved_at, approved_by}` のみに固定。
  **role・email は送らない**（テストで payload キーを検証）。RLS の列単位制御不可への UI 側対処。
- 自己操作の二重抑止: 自分の行は操作ボタン非描画＋`runAction` 冒頭の早期 return
  （admin の自己無効化・締め出し防止）。
- 拒否・無効化は確認パネル経由（誤操作防止）。承認は approved_at/approved_by を記録（誰がいつ承認したか）。
- role 取得失敗は 'member' に倒す（安全側＝管理画面に入れない方向）。

## 実施した確認

- `/verify TKT-0231`: lint / typecheck / test（505件） / build すべて pass（verify.json 参照）。
- テスト: ボード表示（pending一覧/全ユーザー）・承認 update の列と値・自分の行のボタン非表示・
  確認パネル経由の拒否・`buildStatusUpdate` 単体・`fetchAccountRole` 安全側動作。
- オーケストレーターが admin/page.tsx・admin-profiles.ts・update 呼び出しを監査。指摘なし。

## 残リスク

- RLS は列単位制御不可のため、悪意ある admin が devtools から role 列を直接 update することは
  技術的に可能（admin は信頼ロールという前提。個人運用では admin=本人のみ）。
  昇格・降格操作は Dashboard/SQL のみ（runbook 記載）。
- 承認/拒否のメール通知なし（非ゴール。被承認者は再アクセスで気づく）。
- 一覧はページング無し（少人数前提。利用者が増えたら別チケット）。
- check-gates の photo/csv eval は他チケット未コミット変更の過剰マッチ（実変更は web/ の管理UIのみ）。

## 次の依頼や人判断

- TKT-0232（パスワードリセット）の実装続行。
- hosted 適用後の実機スモーク: admin で承認→対象ユーザーが入れる、非adminの /admin 直叩き → /、
  devtools からの他人行 update 拒否（manual-smokes 参照）。
