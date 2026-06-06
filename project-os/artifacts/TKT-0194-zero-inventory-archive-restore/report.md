---
ticket_id: TKT-0194-zero-inventory-archive-restore
status: ready
---

# TKT-0194 report

## 変更目的

数量が0になった食材を通常の在庫一覧から非表示にし、直近履歴から数量を指定して戻せるようにした。

## 今回追加した安全装置

- 0在庫は即削除せず、`archived_at` を付けて履歴として残す。
- 復元時は0より大きい数量だけを許可する。
- 通常一覧は `archived_at is null` かつ `quantity > 0` だけを表示する。
- 本人データだけ読める・書ける既存RLS policyを履歴にも使う。
- APIキーや秘密鍵は追加していない。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0194-zero-inventory-archive-restore`: pass
- lint: pass
- typecheck: pass
- test: pass（35 files / 281 tests）
- build: pass
- PC幅とスマホ幅で復元履歴パネルの表示と横はみ出しなしを確認した。

## 残リスク

- Supabase本番DBへのmigration適用は未実施。
- 50件を超えた古いアーカイブ行はDB triggerで整理されるため、非常に古い消費イベントの在庫ID参照がnullになる可能性がある。
- verify中に既存のESLint warningが3件出ている。

## 次の依頼や人判断

- 本番反映前にSupabase migrationを適用するタイミングを決める。
- 別ユーザーアカウントで復元履歴が見えないことを実DBで確認すると、RLS確認がより強くなる。
