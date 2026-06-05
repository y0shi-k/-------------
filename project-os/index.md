# project-os

このディレクトリは、会話ログの代わりに「次の行動を再現できる状態」を残すための正本です。

## 役割
- `backlog.md`: マクロ層。今のフォーカス / 次にやる候補 / 保留（live な作業の正本）
- `specs/`: 変更仕様（完了分は `specs/completed/` に移動）
- `tickets/`: 実装タスク（完了分は `tickets/completed/` に移動）
- `artifacts/`: verify / audit / review / report の証跡
- `knowledge/`: 恒久知識
  - `decisions.md`: 決定・理由・却下案（同じ議論のやり直しを防ぐ）
  - `learnings.md`: 学び・失敗パターンと再発防止
  - `glossary.md`: ドメイン用語・判断基準（`/glossary`）
  - `phase-map.md`: 長期ロードマップ / その他: tech-debt, web-migration-map 等

## 最小フロー
1. `specs/` に仕様を書く
2. `tickets/` に目的・acceptance・required_evals を書く
3. 実行結果を `artifacts/` に残す
4. reviewer は `spec + ticket + artifacts` を見て判定する

## 命名規約
- spec: `SPEC-xxxx-<slug>.md`
- ticket: `TKT-xxxx-<slug>.md`
- artifact 保存先: `artifacts/TKT-xxxx/`

## 完了の置き場所（状態 = フォルダ）
- 現役（draft / in_progress / ready系）はトップ階層（`tickets/` `specs/`）に置く。
- 完了（`status: completed`/`done`）は `tickets/completed/` `specs/completed/` へ移動する。
  移動は `/finalize`（内部で `harness/bin/ticket_status.py <TKT> completed`）が自動で行う。
- **ファイル名・`id` は移動しても変えない**（語幹 == `id` を維持）。`artifacts/TKT-xxxx/` は移動しない（id 基準）。
- 採番やチケット探索は completed/ を含めて再帰で走査する（番号の再利用・取りこぼしを防ぐ）。
