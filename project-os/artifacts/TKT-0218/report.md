---
ticket_id: TKT-0218-recipe-card-photo-open-cooking-viewer
status: ready
---

# Report Draft

## 変更目的

「献立・レシピ > レシピ」一覧（`RecipeList`）の各カードは、写真サムネ（`RecipeThumb`）を押してもカード本体と同じ「選択（右の詳細パネル表示）」になるだけで、そのレシピの調理ビュー（CookingViewer 全画面）へ直接入れなかった。写真サムネのクリックで、そのレシピの調理ビューを開けるようにする。

## 今回追加した安全装置

- 調理ビューを開く処理は、カードに既に渡っている `onCook`（= `openCookingViewer`、配線は `recipe-meal-workspace.tsx` 3352 行）を再利用。新規 state・新規ルーティング・新規取得経路は追加しない。「料理する」アイコンボタン（4518 行）と同じ実装パターン。
- `RecipeThumb` を `<button type="button" className="recipe-thumb-button">` でラップし、クリックハンドラは `event.stopPropagation()` してから `onCook(recipe)` を呼ぶ。これによりカード本体 `onClick`（`onSelect`）との二重発火を防ぎ、カード本体クリック＝選択（詳細パネル表示）の従来挙動は不変。
- アクセシビリティ: ネイティブ `<button>` 化によりキーボード（Tab/Enter/Space）とスクリーンリーダーから操作可能。`aria-label` は「{recipe.name} の調理ビューを開く」で用途が明確。`disabled` 時は `onCook` を発火しない。既存の「料理する」「スケジュール」「編集」「削除」「お気に入り」ボタンの aria-label/挙動は不変。
- CSS（`globals.css`）: ボタンをグリッドセル（48px / PC は full-width 4:3 / スマホ 36px）に収め、内部 `.recipe-thumb` を 100% で充填。hover で軽い拡大＋リング、`:focus-visible` でアウトラインを付与（過度な装飾なし）。`.recipe-card > .recipe-thumb` を参照していた既存3セレクタ（base / `min-width:1024px` / `max-width:640px`）を新ラッパー構造に追随させた。
- 写真URLは既存 `imageUrls.get(recipe.id)`（署名付きURL）をそのまま使用。Storage・取得ロジックは無変更。イミュータブル方針・既存命名を維持。

## 実施した確認

- `/verify TKT-0218`（`harness/bin/verify_web.sh`）: lint / typecheck / test / build すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean）すべて pass。結果は `verify.json`。
- 単体テスト追加（`recipe-meal-workspace.test.tsx`）: レシピカードのサムネボタン（aria-label「カレー の調理ビューを開く」）クリックで「調理ビューア全画面」ダイアログが開くことを検証。既存55テストも全 pass（新ボタンの aria-label は固有名つきのため、既存の `getByRole("button", { name: "調理ビューを開く" })` とは衝突しない）。
- `supabase_schema_change` / `photo_upload_storage` は diff の語彙（`web/` パス＋`recipes` テーブル名トークン、`RecipeThumb`/署名URL読込まわりの `image`/`Storage` 文字列）に機械マッチするが、本変更は写真クリック導線とUI（JSX/CSS/テスト）のみで、DB schema / migration / Auth・RLS / 写真Storage の保存系は無変更。チケット front-matter の `required_gates`（spec_ready / implementation_ready / verify_passed / report_ready）と owner_notes のとおり manual-smokes / review は不要（TKT-0213/0215/0216/0217 と同じ運用）。

## 残リスク

- なし（既存の `onCook`/`openCookingViewer` 経路と既存署名URLを再利用したのみ）。本機能上の新規リスクは生じない。

## 次の依頼や人判断

- 実機スモーク（`pwa_mobile_ui`）: レシピ一覧でカードの写真サムネをタップ → 該当レシピの調理ビューが開き内容が一致 / 写真以外のカード領域タップ → 従来どおり選択（詳細パネル）のまま / 「料理する」等のカード内ボタンが二重発火せず動作 / 写真ボタンが Tab フォーカス・Enter で開く、を 375px とCanvas幅のスマホ実機で目視確認。
