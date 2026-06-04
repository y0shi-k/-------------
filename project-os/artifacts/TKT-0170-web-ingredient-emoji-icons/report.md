# TKT-0170 実装レポート

## 結論

在庫一覧とAI食材登録の認識結果に `<IngredientIcon>` を追加し、食材名から `ingredientEmoji(name)` 経由で絵文字アイコンが表示されるようにした。

## 変更内容

- `web/src/components/inventory-board.tsx`
  - 在庫一覧の既存文字バッジ（`FD` / `SP` / `AI`）を `<IngredientIcon name={item.name} />` に置き換えた。
  - AI解析候補カードに `<IngredientIcon name={candidate.item.name} />` を追加した。
  - 在庫CRUD、数量変更、期限表示、AI解析、保存処理は変更していない。
- `web/src/app/globals.css`
  - 在庫アイコンとAI候補アイコンのサイズ・配置だけを調整した。
  - スマホで候補カードや在庫カードが崩れにくいよう、既存グリッド内で固定サイズのアイコンとして扱った。
- `web/src/__tests__/inventory-board.test.tsx`
  - 在庫一覧とAI解析候補に食材名ラベル付きの絵文字アイコンが出ることを確認した。

## 非変更範囲

- schema / Storage / auth / RLS / AI route は変更なし。
- Gemini APIキーやSupabase秘密鍵の扱いは変更なし。コードへの直書きなし。
- Canvas版 `app.html` は未変更。

## 検証

- `npm test -- inventory-board.test.tsx`: pass（18 tests）
- `harness/bin/verify_web.sh TKT-0170-web-ingredient-emoji-icons`: pass
  - lint: pass
  - typecheck: pass
  - test: pass
  - build: pass
  - no_gas_dependency: pass
  - no_hardcoded_secret: pass
  - supabase_rls_present: pass

## 注意

- `ai_server_route` / `photo_upload_storage` 系evalは、チケット文言や画面文言の「AI」「写真」「Storage」語彙で過剰マッチする可能性がある。ただし今回の実装は表示追加のみで、実際のAI route / Storage処理は変更していない。
- 絵文字の見た目はOSやブラウザによって少し差が出る。
