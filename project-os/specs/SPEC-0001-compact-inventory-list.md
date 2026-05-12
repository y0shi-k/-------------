# SPEC-0001-compact-inventory-list.md

## 概要
在庫一覧のUIをカード型からコンパクトな行リスト型に変更し、一覧性・操作性を向上させる。

## Acceptance Criteria

1. **コンパクト行表示**
   - 1行に品名、実質期限、数量、単位、保存場所を表示
   - 1画面に15件以上表示可能な密度
   - 各行に編集ボタン（✎）と削除ボタン（🗑）を配置

2. **ソート機能**
   - ヘッダー下にソート切り替えボタン（期限順 / 名前順 / 購入日順）
   - デフォルトは「実質期限が近い順（昇順）」
   - 実質期限が未設定の項目はリスト末尾に配置

3. **期限ハイライト**
   - 期限切れまたは本日：`bg-rose-50 border-rose-200`
   - 3日以内：`bg-amber-50 border-amber-200`
   - それ以外：通常表示
   - 期限表示は `MM/DD` 形式のバッジでコンパクトに

4. **数量ワンタップ調整**
   - 各行に `[-]` `[+]` ボタンを配置
   - タップで数量を1単位増減
   - 0以下にならない制御
   - 変更後はGAS経由でDBに即時反映し、再読み込み

5. **編集モーダル**
   - 既存の `itemModal` を流用・拡張
   - DB在庫アイテムの編集時は `handleStagingSave` とは別に `updateInventoryItem` を呼び出し
   - 編集可能項目：品名、数量、単位、保存場所、購入日、開封日、実質期限、メモ
   - 削除は各行の🗑ボタンから `deleteInventoryItem` を呼び出し、確認ダイアログ後実行

6. **スキーマ制約**
   - Google Spreadsheet のカラム定義を変更しない
   - 追加・削除・リネームは行わない

## 技術制約
- 単一HTMLファイル（app.html）内に全て実装
- Tailwind CSS の既存クラス構成を踏襲
- `executeGAS()` 関数を必ず通す
- 二重送信防止（`setStatus()` によるdisabled制御）

## 影響範囲
- `app.html` のみ
- 主に `renderList()` 関数の在庫表示部分
- `state` オブジェクトに `sortBy` を追加
- 新規関数：`openInventoryEditor`, `adjustInventoryQty`, `updateInventoryItem`, `deleteInventoryItem`
