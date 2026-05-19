# AI Harness Index

このディレクトリは、Stock Master で AI が参照する共通ハーネスです。

## まず見るもの
- 正本/生成物の境界: `rules/source-of-truth.md`
- verify と phase gate: `rules/verify-and-gates.md`
- データ安全ルール: `rules/data-safety.md`
- 技術スタック・絶対制約: `rules/tech-stack.md`
- コーディング規約: `rules/coding-standards.md`
- データベーススキーマ: `rules/schema.md`
- 報告の型: `rules/reporting.md`
- 更新ポリシー: `rules/update-policy.md`
- 役割分離: `roles/`
- テンプレ: `templates/`
- 状態基盤: `../project-os/index.md`

## 標準実行フロー
0. AI はソースコードを編集する前に、対象 `project-os/tickets/` を確認し、有効な ticket が無ければ先に作成する
1. 非 trivial な変更では、`project-os/tickets/` の対象 ticket を確認し、無ければ template から新規作成する
   - ただし同一セッション内の同一画面・同一目的の軽量UI調整は、新規 ticket を乱発せず直近の関連 ticket に集約する
2. 関連 `spec` を確認し、無ければ template から新規作成する
3. `spec_ready` と `implementation_ready` が揃うまで実装に入らない
4. 編集元ファイルだけを更新し、生成物だけを直接直さない
5. `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'` を標準で実行する
   - 軽量UI調整の連続中は各小修正ごとに full verify/artifact を作らず、最後にまとめて実行・記録する
6. 監査が必要な変更だけ任意監査コマンドを実行する（現時点では未定）
7. verify / audit / manual smoke / review / report を `project-os/artifacts/TKT-xxxx/` に残す
   - 同一 ticket に集約した軽量UI調整は、同じ artifact 群へ追記・更新してよい
8. reviewer は会話ではなく `spec + ticket + artifacts` を読んで判定する
9. required gate が1つでも閉じていない場合、AI は「完了」と報告しない

## 軽量UI調整の扱い
- 対象: 同一画面内のレイアウト、表示件数、省略表示、ツールチップ、文言、CSSクラス、既存描画ロジックの小変更
- 条件: Spreadsheet スキーマ、GAS通信、`pendingSync`、保存形式、複数画面契約を変更しない
- 運用: 直近の関連 ticket/spec/artifacts にまとめ、verify は一連の調整が落ち着いたタイミングで実行する
- 例外: データ保存・同期・通信・削除・移行・複数画面にまたがる変更は従来どおり新規 ticket と full gate を使う

## この層の責務
- AI 運用ルールを分割して保つ
- 役割と不可侵境界を明記する
- `project-os/` へ残すべき状態を定義する
- `harness/*.json` の機械可読基準への入口になる
