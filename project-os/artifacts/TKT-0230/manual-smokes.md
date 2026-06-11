---
ticket_id: TKT-0230-approval-gate-routing
status: passed
execution_mode: static_only
target_evals:
  - auth_and_rls_policy
---

# Manual Smokes

## target_evals

- auth_and_rls_policy（承認状態によるルーティング遮断・middleware/サーバー側ガード）

## executed_checks

実DB（profiles 適用済み環境）なしのため static_only で実施:

- ルーティング純関数の全分岐をユニットテストで固定（4状態×公開/データ/認証/pending パス、23ケース）:
  pending/disabled が /login /signup /データ画面のどこへ行っても /pending、/auth/* は全状態素通し、
  approved の従来挙動（/login→/、データ画面=素通し）維持。
- `fetchAccountStatus` の安全側動作をテストで固定（行なし・エラー・未知 status → pending）。
- /pending 文言出し分け（pending=承認待ち / disabled=利用停止中）をテストで固定。
- AI route 403: 非 approved で usage 消費前に 403 を返すことをテストで固定（両 route）。
- middleware matcher が `/api/ai/*` を覆うことをコードで確認（除外は静的アセットのみ）。
- 既存テスト全件 pass（494件）＝approved ユーザーの既存動作の回帰なし（テスト上）。

## skipped_checks

hosted 適用後（TKT-0233 ゲート）に実機で消化する:

- pending 実アカウント: `/`・在庫・レシピ・/api/ai/* 直叩き → すべて /pending へ（URL直打ち含む）
- disabled 実アカウント: 同様に /pending（停止文言）。再有効化で復帰
- approved 実アカウント: 全画面従来どおり・/pending 直叩きで / へ
- /pending からログアウト → /login
- スマホ幅（375px）での /pending 表示崩れなし
- Supabase 一時障害シミュレーション（任意）: 承認済みが /pending に倒れる動作の確認

## open_risks

- migration（TKT-0228）未適用の本番にこのコードだけデプロイすると全ユーザーが /pending に固定される。
  デプロイは migration 適用とセット（TKT-0233 runbook に手順化）。
