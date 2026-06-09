---
ticket_id: TKT-0215-inventory-card-background-image
status: ready
---

# Report Draft

## 変更目的

食材カード（`.stock-item`）のアイコンは 36px 表示で、ユーザー登録写真が小さく判別しづらい。登録写真があるカードに限り、カード背景へその写真を薄く敷いて視認性を上げる。既存のアイコン表示・レイアウト・期限トーンは維持する。

## 今回追加した安全装置

- 背景画像はカード描画時に既に解決済みの `resolveItemImageUrl(item, userIngredientImages, imageUrls)` の戻り値を再利用（`IngredientIcon` の `imageUrl` と同一変数 `itemImageUrl` を共有し二重呼び出しを回避）。新規の署名URL発行・Storageアクセスは行わない（表示のみ）。
- URLがある時だけ `data-has-bg="true"` と CSS変数 `--bg-image` を付与。登録写真が無いカード（絵文字フォールバック/標準SVG）には背景を付けず従来表示のまま。
- 背景画像の上に `linear-gradient` のオーバーレイ（不透明度 0.88〜0.90）を重ね、食材名・期限バッジ・数量ステッパーの可読性を維持。
- 期限切れ/期限近トーン併存時は、併用セレクタ（`[data-has-bg]:has(.expiry-chip[data-tone="..."])`、単独 `:has` より詳細度が高い）でオーバーレイを赤/オレンジ寄りにし、識別を維持。
- Canvas幅（`.canvas-inventory-list .stock-item`、白背景）でも `[data-has-bg]` 用に白寄りオーバーレイを別途定義。
- `background-attachment: fixed` は不使用（モバイル崩れ・スクロール負荷回避）。
- 背景は装飾扱いで `alt`/`aria` を追加せず、既存 `IngredientIcon` の aria-label を維持（スクリーンリーダー向け情報は増えない）。

## 実施した確認

- `/verify TKT-0215`（`harness/bin/verify_web.sh`）: lint / typecheck / test / build すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean）すべて pass。結果は `verify.json`。
- `photo_upload_storage` / `supabase_schema_change` は diff の語彙（image/photo 等・テーブル名トークン）に機械マッチするが、保存系・schema は無変更（表示のみ）。チケット front-matter の `required_gates`（spec_ready / implementation_ready / verify_passed / report_ready）と owner_notes のとおり manual-smokes / review は不要。

## 残リスク

- 背景画像の明度がカードごとに異なるため、固定オーバーレイ不透明度では画像により文字可読性が上下し得る。代表的な明るい/暗い写真での文字・バッジ・ステッパー可読性は実機スモークで確認推奨。
- 期限切れ赤背景＋写真背景の重なりで「期限切れ」識別が弱まる懸念。トーン併用オーバーレイ色（赤/オレンジ）で調整済みだが実機目視推奨。

## 次の依頼や人判断

- 実機/DevTools での目視スモーク（明暗の異なる登録写真でのテキスト/バッジ/ステッパー可読性、期限切れ・期限近トーン併存時の識別、375px モバイル幅と Canvas幅でのレイアウト非崩れ）。
