---
id: TKT-0215-inventory-card-background-image
title: 食材カードに背景画像を表示（ユーザー登録写真があるカードのみ・視認性向上）
status: completed
goal: 食材カードの登録写真が36pxアイコンでは小さく認識できない問題を、登録写真があるカードの背景に画像を薄く敷くことで改善する。
acceptance:
  - 食材管理（ALL STORAGE）の食材カードで、ユーザー登録写真がある（`resolveItemImageUrl` がURLを返す）カードはカード背景にその写真が薄く表示される
  - 絵文字フォールバックや標準SVGアイコンのみのカード（登録写真が無いカード）は背景画像が付かず、従来表示のままになる
  - 背景画像の上にオーバーレイ（半透明レイヤー）が乗り、食材名・期限バッジ・数量ステッパー等のテキスト/操作が従来どおり読める
  - 既存の左アイコン（`IngredientIcon`）表示は残り、背景と二重表示になっても破綻しない
  - 期限切れ（`data-tone="expired"`）/期限近（`data-tone="soon"`）の赤・オレンジ系トーンが背景画像と併存しても識別できる
  - 追加修正: 背景画像ありカードの上部操作（選択ラベル、編集/削除アイコンボタン）にも文字ラベルと同じ背景プレートが入り、写真に埋もれない
  - 追加修正: 数量表示（例: `3パック`）がスマホ幅の画像ありカードでも1行に収まり、文字単位で折り返されない
  - Canvas幅レイアウト（`.canvas-inventory-list .stock-item`）でも背景画像が崩れない
  - 背景は装飾扱いで、スクリーンリーダー向けの情報が増えない（既存 `IngredientIcon` の aria-label を維持）
  - スクロール時のパフォーマンス劣化やモバイル幅崩れが起きない（`background-attachment: fixed` は使わない）
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0215-inventory-card-background-image/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0215-inventory-card-background-image/verify.json
  - artifacts/TKT-0215-inventory-card-background-image/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0215`。コマンドの正本は `harness/registry.json`
  - 非危険変更（既に解決済みの署名URLを背景に表示するだけ。アップロード/圧縮/Storage保存/バケット設定・RLSには触れない）。必須成果物は verify.json + report.md のみ
  - `image|photo|写真|画像` が diff に出るため `photo_upload_storage` 正規表現に機械マッチし得るが、保存系は変更しない（表示のみ）。manual-smokes/review は不要
---

# Summary

食材カード（`.stock-item`）はアイコン部を 36px で表示するため、ユーザー登録写真が小さく判別しづらい。本チケットでは、登録写真があるカードに限りカード背景へ画像を薄く敷いて視認性を上げる。既存のアイコン表示・レイアウト・期限トーンは維持する。

画像URLは既にカード描画時に `resolveItemImageUrl(item, userIngredientImages, imageUrls)` で解決済み（`IngredientIcon` の `imageUrl` に渡している）ので、それを背景にも流用する。新規の署名URL発行・Storageアクセスは行わない。

`required_evals` は表示のレスポンシブ改修で、DBスキーマ・auth/RLS・写真Storage（保存）・AIルート・CSV移行に該当しない（非危険）。`pwa_mobile_ui` を採用。

## 実装メモ

- 対象ファイル: `web/src/components/inventory-board.tsx`, `web/src/app/globals.css`
- `web/src/components/inventory-board.tsx`:
  - 食材カード `<article className="stock-item">`（1742行付近、`IngredientIcon` の `imageUrl={resolveItemImageUrl(item, userIngredientImages, imageUrls)}` を渡している箇所）で、同じ `resolveItemImageUrl(...)` の戻り値を一度変数に取り、URLがある時のみ `style={{ "--bg-image": \`url(${url})\` } as React.CSSProperties}` と `data-has-bg="true"` を付与する（URLが無いカードには付けない）。
  - `resolveItemImageUrl` は既存関数（`item.image_storage_path` 優先 → 同名 `userIngredientImages` フォールバック → `imageUrls` Map から signed URL を引く）。二重呼び出しを避けたいので IngredientIcon に渡す値と共有する。
- `web/src/app/globals.css`:
  - `.stock-item[data-has-bg]` に `background-image: linear-gradient(<overlay>, <overlay>), var(--bg-image); background-size: cover; background-position: center; background-repeat: no-repeat;` を追加。可読性のためオーバーレイ不透明度は 0.85〜0.90 目安（既存 `.stock-item` の `background: #f8fafc` を踏まえた色）。
  - 期限切れ/期限近の条件付き背景（既存 `:has(.expiry-chip[data-tone="expired"])` = `#fff1f2` / `[data-tone="soon"]` = `#fff7ed`）について、`[data-has-bg]` と併用時のオーバーレイ色を赤/オレンジ寄りにして識別を維持する。
  - Canvas幅（`.canvas-inventory-list .stock-item`、白背景 `#fff`）でも `[data-has-bg]` のオーバーレイ色を白寄りで合わせる。
  - `background-attachment: fixed` は使わない（モバイル崩れ・スクロール負荷回避）。
- 追加修正:
  - 背景写真があるカードのみ、`.select-row` と `.item-actions .icon-button` に文字ラベルと同じ `--stock-label-bg-*` 系の背景プレートを付ける。
  - 数量表示に `white-space: nowrap` を付け、背景プレートの左右余白を少し詰めて短い単位名が2行にならないようにする。
  - 写真なしカード、保存処理、画像URL解決、Storage権限には触れない。
- 既存パターン/再利用:
  - 画像出所・優先順位は `resolveItemImageUrl` / `IngredientIcon`（`web/src/components/ui/ingredient-icon.tsx`）の既存ロジックをそのまま使う。
  - 期限トーンは既存 `expiryBadge(item)` と `.expiry-chip[data-tone]` の仕組みに乗る。
- 注意: GAS/Spreadsheet/Drive 不使用。APIキー直書き禁止。署名URLの発行方法・有効期限・Storageバケット権限には触れない（表示のみ）。

## 非ゴール

- 食材写真のアップロード/差し替え/削除フローやAI解析候補の保存処理の変更。
- アイコン（`IngredientIcon`）自体のサイズ拡大やデザイン刷新（背景追加のみで対応）。
- 背景画像のキャッシュ戦略・遅延読み込み等のパフォーマンス最適化（崩れ・重さが出た場合のみ別途検討）。

## 依存チケット

- なし（独立。TKT-0213/0214 と並行可）

## 残リスク

- 背景画像の明度がカードごとに異なるため、固定オーバーレイ不透明度ではテキストの可読性が画像により上下する。代表的な明るい/暗い写真で verify 時に文字・バッジ・ステッパーが読めるか手元確認する。
- 期限切れ赤背景＋写真背景の重なりで「期限切れ」識別が弱まる懸念。トーン併用時のオーバーレイ色を調整して確認する。
