---
ticket_id: TKT-0076-ai-processing-cancel
status: pending_user_canvas_check
---

# Manual Smokes

Canvas実表示でユーザー確認する項目。

- レシピテキスト解析中に「キャンセル」を押すと、レシピ編集画面が開かず、通常操作に戻る。
- AI相談中に「キャンセル」を押すと、相談結果の確認ビューへ進まない。
- AIレシピ生成中に「キャンセル」を押すと、AIプレビューモーダルが開かない。
- 登録待ちの期限解析中に「キャンセル」を押すと、`limit2` が更新されない。
- 「まとめてAI解析して在庫へ追加」中にキャンセルすると、登録待ちが在庫へ自動登録されない。
- 画像AI解析中に「キャンセル」を押すと、登録待ちに抽出結果が追加されない。
- キャンセル後、ボタン・入力・セレクトがすぐ操作可能になる。

## Static Notes

- Gemini API の直接 `fetch` 呼び出しには `AbortController.signal` を追加済み。
- GAS通信、pendingSync、Spreadsheet書き込み経路は変更していない。
