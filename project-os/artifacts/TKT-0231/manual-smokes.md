---
ticket_id: TKT-0231-admin-user-management
status: passed
execution_mode: static_only
target_evals:
  - auth_and_rls_policy
---

# Manual Smokes

## target_evals

- auth_and_rls_policy（admin 権限判定・profiles の admin 直更新）

## executed_checks

実DB（profiles 適用済み環境）なしのため static_only で実施:

- サーバー側権限判定の机上トレース: 未ログイン→/login、member→/（redirect）、admin のみ一覧取得へ。
  middleware（TKT-0230）が pending/disabled を先に /pending へ落とすため到達経路は approved のみ。
- update payload をテストで固定: キーが `approved_at/approved_by/status` のみ＝role・email 送出なし。
- 自己操作抑止をテストで固定: 自分の行に操作ボタンが描画されない（＋runAction 早期 return の二重ガード）。
- 拒否が確認パネル経由でのみ実行されることをテストで固定。
- RLS との整合（机上）: admin update は `profiles_update_admin`（is_admin()）で許可、member セッションの
  他人行 update は該当ポリシーなしで 0 行（TKT-0228 の設計）。
- ナビ出し分け: isAdmin=false でサイドバー/設定にリンク非表示（テスト・コード確認）。

## skipped_checks

hosted 適用後（TKT-0233 ゲート）に実機で消化する:

- admin 実アカウント: /admin で pending 申請を承認 → 対象ユーザーが再アクセスで `/` に入れる
- 拒否/無効化 → 対象が /pending（停止文言）へ。再有効化で復帰
- member 実アカウント: /admin 直叩き → / へ redirect。ナビにリンク非表示
- member セッションの devtools から profiles 全行 select → 自分の行のみ / 他人行 update → 失敗
- admin が自分の行を操作できないこと（UI上ボタンなし）
- スマホ幅（375px）での管理画面表示崩れなし

## open_risks

- 悪意ある admin の role 列直接 update は RLS 上可能（信頼ロール前提・昇降格は Dashboard/SQL のみ）。
- 実機での RLS 実挙動（クロスユーザー update 拒否）は適用後スモークまで未検証。
