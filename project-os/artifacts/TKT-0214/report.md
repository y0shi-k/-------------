---
ticket_id: TKT-0214-cooking-record-card-photo-grid-modal
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

料理記録カード（`HistoryDateGroup` 内の `.history-item`）が複数写真でも先頭1枚しか出さず、PC幅の横余白を活かせていない状態を改善する。あわせて操作を「行クリック→写真モーダル」に集約し、カード上の「レシピを見る」をモーダル内へ移してカードを軽くする。すべて表示（presentational）改修で、写真の保存・圧縮・Storage には触れない。

## 今回追加した安全装置

- **イベント伝播の制御**: 「編集」ボタンは `stopPropagation()` してから `onEdit` を呼び、行クリックの写真モーダルを開かない。サムネクリックも `stopPropagation()`（写真モーダルは冪等だが二重発火を明示的に止める）。
- **アクセシビリティ**: 行クリックは `<article>` を `role="button"` 化せず（jsx-a11y `no-noninteractive-element-to-interactive-role` 回避）、透明な実 `<button className="history-item-hitarea">`（`aria-label="◯◯の記録を開く"`）を重ねてキーボード操作（Enter/Space）でも開けるようにした。
- **署名URLの非増発**: サムネ格子の画像URLは既存の共有キャッシュ `photoUrlMap`（`useCachedSignedUrls`）から解決し、新規署名URLを発行しない（TKT-0205 の方針を維持）。
- **レイアウト破綻防止**: 写真0枚は従来の「写真なし」表示を維持。サムネ格子は `pointer-events:none`＋サムネ個別 `auto` で余白クリックを下のヒットエリアへ通し、`padding-top:34px` で右上の編集ピルとの重なりを避ける。
- **スマホ縮退**: `@media (max-width:640px)` で `has-photo-grid` を従来2カラムへ戻し右格子を `display:none`。縦余白を圧迫せず、枚数は左の `📷N` バッジで把握できる。

## 実施した確認

- `/verify TKT-0214` → **VERIFY_PASSED**（lint / typecheck / test / build すべて pass、policy 4項目 pass）。artifact: `project-os/artifacts/TKT-0214/verify.json`。
- ユニットテスト（`web/src/__tests__/cooking-history-board.test.tsx`、13件 pass）。追加・更新:
  - カード本体に「レシピを見る」が無いこと、recipe_id ありの記録を開くとモーダル内に「レシピを見る」が出て `requestViewRecipe("recipe-1","cooking")` を呼ぶこと、recipe_id なしでは出ないこと。
  - 行クリック／サムネクリックで写真モーダルが開くこと。
  - 写真9枚で `+2` オーバーレイが出てクリックで写真モーダルが開くこと。
  - 編集ボタンが写真モーダルを開かず編集モーダルのみ開くこと。

## 残リスク

- **check-gates の語彙過剰マッチ**: diff に `photo|image|写真|画像` と `meal_schedules` 等のテーブル名が出るため `photo_upload_storage` / `supabase_schema_change` に機械マッチし、`manual_smokes_done` / `review_ready` gate が未閉と表示される。本変更は**表示のみ**で Storage・schema・auth/RLS・AI route・CSV移行に一切触れないため、owner_notes どおり非危険として軽量プロセス（verify.json + report.md）で完了する（TKT-0210〜0212 と同じ扱い）。
- **格子の列数はカード幅依存**: タイムライン等の狭い文脈でサムネが潰れないかは実機目視で確認したい（`pwa_mobile_ui`）。
- spec は無い単票変更のため `spec_ready` gate は N/A（`related_specs: []`、TKT-0212 と同様）。

## 次の依頼や人判断

- 実機/DevTools での目視確認（`pwa_mobile_ui`）:
  - PC幅: 複数写真カードで右サムネ格子の列数が余白に応じて増え、編集ピルとサムネが重ならないこと。`+N` の枚数とモーダル全枚表示が正しいこと。
  - スマホ幅（≤640px）: 右格子が畳まれ縦余白を圧迫しないこと、`📷N` バッジで枚数が分かること。
  - 行クリック＝写真モーダル、編集ボタン＝編集モーダルのみ、モーダル内「レシピを見る」遷移（recipe_id あり/なし）の挙動。
