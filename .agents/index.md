# AI Harness Index

このディレクトリは、Stock Master で AI が参照する共通ハーネスです。

## まず見るもの
- 正本/生成物の境界: `rules/source-of-truth.md`
- verify と phase gate: `rules/verify-and-gates.md`
- データ安全ルール: `rules/data-safety.md`
- 依存関係安全ルール: `rules/dependency-security.md`
- 技術スタック・絶対制約: `rules/tech-stack.md`
- コーディング規約: `rules/coding-standards.md`
- データベーススキーマ: `rules/schema.md`
- 報告の型: `rules/reporting.md`
- 更新ポリシー: `rules/update-policy.md`
- 役割分離: `roles/`
- テンプレ: `templates/`
- 状態基盤: `../project-os/index.md`

## 対象範囲（重要）
- **Canvas版 `app.html` は凍結・参照専用。編集しない。** 以降のフローは Web版（`web/` + `supabase/`）が対象。

## 標準実行フロー
0. AI はソースコードを編集する前に、対象 `project-os/tickets/` を確認し、有効な ticket が無ければ先に作成する（`/new-ticket`）
   - Web版移植は `TKT-0100` 以降を使う
1. 非 trivial な変更では、`project-os/tickets/` の対象 ticket を確認し、無ければ template から新規作成する
   - ただし同一セッション内の同一画面・同一目的の軽量UI調整は、新規 ticket を乱発せず直近の関連 ticket に集約する
2. 関連 `spec` を確認し、無ければ template から新規作成する
3. `spec_ready` と `implementation_ready` が揃うまで実装に入らない
4. 編集元ファイルだけを更新し、生成物だけを直接直さない
5. 変更後は `/verify`（= `harness/bin/verify_web.sh`）を実行する。verify コマンドの正本は `harness/registry.json`
   - 軽量UI調整の連続中は各小修正ごとに full verify/artifact を作らず、最後にまとめて実行・記録する
6. `/check-gates` で未閉の phase gate を確認する（diff から required_evals を自動判定）
7. **必須成果物は既定で `verify.json` + `report.md` の2つ**。`project-os/artifacts/TKT-xxxx/` に残す（`/finalize`）
   - `manual-smokes.md` / `review.md` は**危険変更時のみ必須**（`change_evals.json` の `danger: true` eval = Supabase schema / auth・RLS / 写真Storage / AI server route / CSV移行）
   - 同一 ticket に集約した軽量UI調整は、同じ artifact 群へ追記・更新してよい
8. required gate が1つでも閉じていない場合、AI は「完了」と報告しない

## 軽量UI調整の扱い（正式ルール）
- 対象: 同一画面内のレイアウト、表示件数、省略表示、ツールチップ、文言、CSSクラス、既存描画ロジックの小変更
- 条件: Supabase schema、auth/RLS、Storage、API契約、保存形式、複数画面契約を変更しない
- 運用: 直近の関連 ticket/spec/artifacts にまとめ、verify は一連の調整が落ち着いたタイミングで `/verify` を実行する
- 成果物: 既定どおり `verify.json` + `report.md` を最後にまとめて更新する（小修正ごとに作らない）
- 例外（= 危険変更）: Supabase schema / auth・RLS / 写真Storage / AI server route / CSV移行 / データ削除 は従来どおり新規 ticket と full gate（manual-smokes + review 含む）を使う

## この層の責務
- AI 運用ルールを分割して保つ
- 役割と不可侵境界を明記する
- `project-os/` へ残すべき状態を定義する
- `harness/*.json` の機械可読基準への入口になる

## Web版移植の扱い
- Web版は `web/` にNext.jsアプリ、`supabase/` にDB/Storage/Auth定義、`scripts/` にCSV移行などの補助スクリプトを置く。
- Web版ではGAS、Google Spreadsheet、Google Driveを使わない。
- Supabase本番DB、Storage画像、Vercelデプロイは生成物として扱い、正本を通さず直接変更しない。
- APIキーやSupabase秘密鍵は `.env.local` とVercel環境変数で管理し、コードやドキュメントに実値を書かない。
