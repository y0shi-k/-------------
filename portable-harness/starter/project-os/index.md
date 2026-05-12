# project-os

このディレクトリは、会話ログの代わりに「次の行動を再現できる状態」を残すための正本です。

## 役割
- `specs/`: 変更仕様
- `tickets/`: 実装タスク
- `artifacts/`: verify / audit / review / report の証跡
- `knowledge/`: 恒久知識

## 最小フロー
1. `specs/` に仕様を書く
2. `tickets/` に目的・acceptance・required_evals を書く
3. 実行結果を `artifacts/` に残す
4. reviewer は `spec + ticket + artifacts` を見て判定する

## 命名規約
- spec: `SPEC-xxxx-<slug>.md`
- ticket: `TKT-xxxx-<slug>.md`
- artifact 保存先: `artifacts/TKT-xxxx/`
