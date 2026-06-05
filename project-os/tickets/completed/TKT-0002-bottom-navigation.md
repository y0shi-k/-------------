# TKT-0002-bottom-navigation.md

---
ticket_id: TKT-0002
related_specs:
  - SPEC-0002-bottom-navigation.md
owner_role: ai-implementer
required_evals:
  - ui_component_addition
status: completed
---

## 目的

Phase2（献立プランナー）・Phase3（クッキングビューア）へ向けたモード切り替えの基礎UIを構築する。現在は在庫管理（モードA）のみの画面構成であり、今後のフェーズ拡張に備えたボトムナビゲーションバーを追加する。

## タスク

- [x] ボトムナビゲーションバーのUIコンポーネントを `app.html` に追加
- [x] 各モード（A: 在庫/買い物、B: 献立、C: クッキング）への切り替え機構を実装
- [x] 現状の在庫管理画面を「モードA」として配置する
- [x] Phase2/3未実装のモードは「Coming Soon」表示または同等のプレースホルダーを設置
- [x] ナビゲーション状態は `state` オブジェクトで管理し、DOM書き換え方式でモード切り替えを行う
- [x] verify コマンド実行
- [x] artifacts を `project-os/artifacts/TKT-0002/` に作成

## Acceptance

- 画面下部に固定のナビゲーションバーが表示される
- タップでモード切り替えができ、表示領域が切り替わる
- モードAは現状の在庫管理画面と同等に動作する
- HTML構文チェックが通る
- `executeGAS` と `GAS_URL` が残っている
- スマホファーストの操作性が損なわれない（タップ領域の確保、safe-area対応等）
