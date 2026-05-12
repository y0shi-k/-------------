# データベーススキーマ（変更禁止）

初期化時に5シートを作成し、1行目に以下のヘッダーを**厳密に**設定すること。カラムの追加・削除・順序変更・名前変更は**禁止**。

## ① 食材在庫

| 列 | カラム名 | 型 | 備考 |
|---|---|---|---|
| A | `ID` | String (UUID) | `Utilities.getUuid()` で生成 |
| B | `分類` | String | 食材 / 調味料 |
| C | `品名` | String | |
| D | `数量` | Number | |
| E | `単位` | String | 個, g, ml, 本 など |
| F | `購入日` | String | YYYY-MM-DD |
| G | `開封日` | String | YYYY-MM-DD or 空 |
| H | `表示期限` | String | YYYY-MM-DD（パッケージ印字の賞味/消費期限） |
| I | `実質期限` | String | YYYY-MM-DD or 空（AI推測 or ユーザー設定） |
| J | `保存場所` | String | 冷蔵庫 / 冷凍庫 / パントリー / ベランダ / その他 |
| K | `状態メモ` | String | |

## ② レシピ集

| 列 | カラム名 | 型 | 備考 |
|---|---|---|---|
| A | `レシピID` | String (UUID) | |
| B | `レシピ名` | String | |
| C | `材料JSON` | String | `[{"name":"人参", "amount": 1, "unit": "本"}, ...]` |
| D | `手順JSON` | String | `["手順1", "手順2", ...]` |
| E | `出典` | String | URL or テキスト |
| F | `調理回数` | Number | 初期値0 |
| G | `調理日履歴` | String | JSON配列 `["YYYY-MM-DD", ...]` |

## ③ 献立スケジュール

| 列 | カラム名 | 型 | 備考 |
|---|---|---|---|
| A | `予定日` | String | YYYY-MM-DD |
| B | `食事区分` | String | 朝 / 昼 / 晩 / その他 |
| C | `レシピID` | String (UUID) | |
| D | `レシピ名` | String | |
| E | `ステータス` | String | 未完了 / 完了 |

## ④ 料理履歴

| 列 | カラム名 | 型 | 備考 |
|---|---|---|---|
| A | `履歴ID` | String (UUID) | |
| B | `調理日時` | String | YYYY-MM-DD HH:mm:ss |
| C | `レシピID` | String (UUID) | |
| D | `レシピ名` | String | |
| E | `感想` | String | |
| F | `写真URL` | String | DriveApp保存ファイルURL |
| G | `評価` | Number | 1〜5 |

## ⑤ 買い物リスト

| 列 | カラム名 | 型 | 備考 |
|---|---|---|---|
| A | `リストID` | String (UUID) | |
| B | `品名` | String | |
| C | `必要数量` | Number | |
| D | `単位` | String | |
| E | `ステータス` | String | 未購入 / 購入済 |
| F | `紐づくレシピ名` | String | |
