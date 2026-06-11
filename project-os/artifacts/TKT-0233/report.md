---
ticket_id: TKT-0233-production-auth-runbook
status: ready
---

# Report Draft

## 変更目的

TKT-0228〜0232 で実装した承認制ログインを、本番（hosted Supabase + Vercel）で有効にするための
運用手順書を整備した（SPEC-0228 ⑥/⑥・イニシアチブ完結）。コード・migration の変更は一切ない
docs のみの変更。「コードはあるが本番で動かない」「適用順を誤って全員 /pending 化」の事故を防ぐ。

## 今回追加した安全装置

- **適用順チェックリスト**（`docs/runbook/認証本番化の適用手順.md`）: migration → Dashboard Auth 設定 →
  Vercel デプロイ → 初代 admin 昇格 → E2E スモークの順序を固定し、順序入れ替え時の事故
  （特に **auth_profiles 未適用デプロイ＝全員 /pending 化**）を冒頭と①節の警告で明示。
- 未適用 migration 3点（ai_usage_events / shopping_items_meal_schedule_link / auth_profiles）を
  backlog P1 と統合した一覧化＋適用後の Table Editor 確認項目。
- E2E手動スモーク A〜J（申請→確認メール→pending遮断→承認→利用開始→無効化→再有効化→
  権限境界→PWリセット→ログアウト→375px）。TKT-0228〜0232 の manual-smokes skipped_checks を統合。
- ロールバック方針（Dashboard で Enable Sign Ups 即時OFF・個別無効化・migration は打ち消し方式）。
- service role key を Vercel に置く必要がないこと＋ `NEXT_PUBLIC_` 付与の漏えい警告を明記。
- 秘密情報はすべてプレースホルダ表記（実値なし）。

## 実施した確認

- `/verify TKT-0233`: lint / typecheck / test / build / policy すべて pass（verify.json は
  harness 生成の正本。サブエージェントが自作した簡易版はオーケストレーターが正規実行で置換済み）。
- オーケストレーターが runbook 全文を監査: 参照先4ファイルの実在確認・秘密実値なし・
  既存 §10b と重複記載なし・TKT-0228〜0232 の report/manual-smokes との整合確認。
- 既存 runbook（Supabaseの反映と運用ガイド.md）への変更が §12 の参照1行のみであることを確認。

## 残リスク

- Dashboard UI 名称は執筆時点依存（適用時に画面名を目視確認・必要なら手順書更新）。
- 実際の本番適用・E2Eスモークは未実施（ユーザー作業）。手順書整備までが本チケットの責務。
- SMTP 未移行のレート制限・recovery 失効時の /login エラー文言未実装は既知（手順書の残リスク表に記載）。

## 次の依頼や人判断

- **ユーザー作業**: `docs/runbook/認証本番化の適用手順.md` に沿って本番適用
  （①migration `supabase db push` → ②Dashboard Auth 設定 → ③Vercel デプロイ → ④初代 admin SQL → ⑤E2Eスモーク）。
  これで TKT-0228〜0232 の manual-smokes skipped_checks が消化される。
- 適用で問題が出た場合は該当チケットの report/review を参照のうえ追加チケットで対処。
