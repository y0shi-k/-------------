---
ticket_id: TKT-0158-web-desktop-inventory-layout
status: ready
generated_at: 2026-06-03T22:13:18+09:00
---

# TKT-0158 実装レポート

## 結論

食材管理のPC向け多カラム化を実装した。スマホ表示、写真Storageアップロード、AI解析API、Supabase schema/RLS は変更していない。

## 変更内容

- `InventoryBoard` が TKT-0157 の `useShellSubView()` を使い、PCサイドバーの「在庫一覧」「買い物リスト」選択と内部表示を同期するようにした。
- PC幅では食材管理内の表示切替ボタンを隠し、追加ボタンは残した。スマホでは従来どおり内部切替を表示する。
- PC幅の在庫一覧を複数カラムのカードグリッドにし、カード左にカテゴリ/由来を示す小さなアイコンを追加した。
- 写真AI登録モーダルは、AI候補があるPC幅でアップロード枠と候補リストを2カラム表示にした。
- `TodayDashboard` は現コードで `InventoryBoard` に内包されていないため、TKT-0158では変更しない方針を ticket/spec に反映した。

## 確認結果

- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run test`: pass（17 files / 123 tests）
- `npm run build`: pass
- policy: GAS混入なし、秘密直書きなし、Supabase RLS確認 pass

詳細は `verify.json` を参照。

## 残リスク

- 実機またはブラウザでのPC/スマホ目視確認は未実施。特に在庫カードの折り返し、写真AI登録モーダルの2カラム表示、買い物リスト切替を目視確認するとよい。
- `inventory-board.tsx` は写真/AI関連コードを含むが、今回の変更はレイアウトと表示状態同期のみ。APIキー、写真URL、Storage/API処理は変更していない。
