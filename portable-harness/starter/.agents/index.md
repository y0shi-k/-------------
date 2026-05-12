# AI Harness Index

このディレクトリは、`{{PROJECT_NAME}}` で AI が参照する共通ハーネスです。

## まず見るもの
- 正本/生成物の境界: `rules/source-of-truth.md`
- verify と phase gate: `rules/verify-and-gates.md`
- データ安全ルール: `rules/data-safety.md`
- 報告の型: `rules/reporting.md`
- 更新ポリシー: `rules/update-policy.md`
- 役割分離: `roles/`
- テンプレ: `templates/`
- 状態基盤: `../project-os/index.md`

## 標準実行フロー
0. AI はソースコードを編集する前に、対象 `project-os/tickets/` を確認し、有効な ticket が無ければ先に作成する
1. 非 trivial な変更では、`project-os/tickets/` の対象 ticket を確認し、無ければ template から新規作成する
2. 関連 `spec` を確認し、無ければ template から新規作成する
3. `spec_ready` と `implementation_ready` が揃うまで実装に入らない
4. 編集元ファイルだけを更新し、生成物だけを直接直さない
5. `{{VERIFY_COMMAND}}` を標準で実行する
6. 監査が必要な変更だけ `{{OPTIONAL_AUDIT_COMMAND}}` を実行する
7. verify / audit / manual smoke / review / report を `project-os/artifacts/TKT-xxxx/` に残す
8. reviewer は会話ではなく `spec + ticket + artifacts` を読んで判定する
9. required gate が1つでも閉じていない場合、AI は「完了」と報告しない

## この層の責務
- AI 運用ルールを分割して保つ
- 役割と不可侵境界を明記する
- `project-os/` へ残すべき状態を定義する
- `harness/*.json` の機械可読基準への入口になる
