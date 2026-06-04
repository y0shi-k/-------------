---
id: TKT-0170-web-ingredient-emoji-icons
title: 食材の絵文字アイコン化（在庫一覧＋AI食材登録の認識結果）
status: draft
goal: 参考モック「食材一覧」のように食材を絵文字アイコンで彩り、在庫一覧とAI食材登録の認識結果を視認しやすくする
acceptance:
  - 在庫一覧（`inventory-board`）の食材行/グリッドに `<IngredientIcon>` の絵文字アイコンが表示される
  - AI食材登録の認識結果リストにも `<IngredientIcon>` が表示される
  - 絵文字は `ingredientEmoji(name)` 経由で解決し、未一致は `🥘` にフォールバックする
  - 調味料カテゴリも崩れず表示される
  - 既存の在庫操作（追加/編集/消費/期限表示）の挙動を変えない（アイコンは装飾追加のみ）
  - スマホの既存レイアウト・操作を変えない
  - schema / Storage / auth / RLS / AI route を変更しない（AI登録は表示のみ追加、認識ロジックは触らない）
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0170-web-ingredient-emoji-icons/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0170-web-ingredient-emoji-icons
related_artifacts:
  - artifacts/TKT-0170-web-ingredient-emoji-icons/verify.json
  - artifacts/TKT-0170-web-ingredient-emoji-icons/report.md
owner_role: implementer
owner_notes:
  - 依存: **TKT-0168（ビジュアル基盤）完了が前提**。`<IngredientIcon>` / `ingredientEmoji` を使う。
  - 絵文字は装飾の追加のみ。在庫CRUD・消費量・期限ロジック・AI認識ロジックには手を入れない。
  - AI食材登録の認識結果は `inventory-board.tsx`（staging）側の表示。**`ai_server_route` には触らない**（表示のみ）。語彙的に ai eval が過剰マッチしうる→report に記録。
  - `photo_upload_storage` eval も `画像/写真` 語彙で過剰マッチしうる（AI登録周辺）。実Storage変更は無い旨を report に記録。
  - 非危険変更。verify は `/verify TKT-0170`。Canvas版 `app.html` は触らない。対象は `web/`。スマホ温存。
  - APIキー・秘密情報を直書きしない。console.log を残さない。
---

# Summary

参考モック「食材一覧」のカラフルな食材アイコン表現に寄せる。在庫一覧とAI食材登録の認識結果に、TKT-0168 の `<IngredientIcon>`（絵文字）を装飾として追加する。ロジックは変えない。

## 背景

- 現状の在庫表示はテキスト中心。参考モックは食材を絵文字（🥕🥩🥚…）で並べて視認性が高い。
- 絵文字は画像生成不要・schema非依存で、低コストに大きく印象が変わる。

## 実装メモ

- `inventory-board.tsx` の食材行/グリッドの先頭に `<IngredientIcon name={item.name} />` を追加。
- AI食材登録（staging 認識結果の一覧）にも同コンポーネントを追加。認識・保存ロジックは無改変。
- `globals.css` はTKT-0168の `.ingredient-icon` を流用。必要なら配置の微調整のみ。
- テスト: 代表食材でアイコンが出る、未知食材でフォールバック `🥘`。

### 共通方針
- `ingredientEmoji`/`<IngredientIcon>` 経由で出す（絵文字ベタ書き禁止）。既存規約・immutable に合わせる。

## 残リスク

- ai_server_route / photo eval の過剰マッチ（語彙由来）。実ロジック・Storage無変更を report に記録。
- 絵文字のOS差で見た目が揺れる（許容）。
- 在庫行のレイアウト幅（アイコン追加で折返し）に注意。スマホ回帰を verify で確認。
