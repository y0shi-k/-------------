---
ticket_id: TKT-0001
status: passed
target_evals:
  - ui_component_addition
  - gas_pattern_change
---

# Manual Smoke Report (TKT-0001)

## executed_checks
- [x] HTML構文チェック (`html.parser` でパス)
- [x] GAS通信パターン確認 (`executeGAS`, `setStatus`, フォーム送信方式が未変更)
- [x] スキーマ整合性（5シート・11カラムの定義に変更なし）
- [x] UI表示整合性（Tailwindクラスが既存パターンと一致：カード/バッジ/ボタン）
- [x] 新規UIコンポーネントの disabled 制御（`setStatus` 内で `document.querySelectorAll('button, input, select')` を制御）

## skipped_checks
- [ ] 実際のGAS通信（ローカル環境ではGASエンドポイントに到達不可のためスキップ）
- [ ] モバイル実機での誤タップ確認（デスクトップブラウザのみ）
- [ ] 画像スキャン機能（本チケットのスコープ外）

## open_risks
- `apiKey` が空文字のまま（既存の技術的負債）
- `adjustInventoryQty` で `unit === 'g' || unit === 'ml'` の場合に50ずつ増減するが、ユーザーが意図しないステップサイズになる可能性（編集モーダルで微調整可能）
- `getMonth()+1` で月表示を行っているが、locale文字列ではなく手動フォーマット（仕様上問題なし）
