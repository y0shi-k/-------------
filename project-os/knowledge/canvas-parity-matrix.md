# Canvas Parity Matrix

## 目的

Web版を「スプシ連携以外はCanvas版と同じ」に近づけるための正本。

この文書は、チャットではなく `project-os/` 上で完全移植の判断基準を残すために使う。

## 最上位方針

- Web版はCanvas版のUI/UX、画面構成、操作フロー、AI機能、スマホ体験を原則として再現する。
- 置き換えてよいものは、GAS、Google Spreadsheet、Google Drive、Canvas固有制約だけ。
- データ保存先はSupabaseへ置き換える。
- APIキーはNext.jsサーバー側で扱い、ブラウザへ出さない。
- 「主要ワークフローだけ動く」は完全移植ではない。

## 判定ラベル

- `same`: Canvas版と同等
- `supabase_replace`: 保存/通信だけSupabaseへ置換し、体験は同等
- `partial`: 一部だけ実装
- `missing`: 未実装
- `changed`: Canvas版と違う体験になっている
- `blocked`: 先行差分の解消まで進めない

## TKT-0113監査結果

`TKT-0109` までのWeb版は、在庫、登録待ち、写真AI解析、レシピ、献立、買い物候補、料理履歴の主要ワークフローを持つ。ただしCanvas版の完全移植ではない。

特に、単位換算、調理完了時の在庫減算、代替品選択、AIレシピ考案、レシピ本文AI構造化、作りたい候補、今日ダッシュボード、料理履歴分析は未移植または大きく不足している。これらはSupabase schemaやCSV移行項目に影響する可能性があるため、`TKT-0110-csv-migration-tool` へはまだ進めない。

## 比較表

| 領域 | Canvas版の期待体験 | Web版の確認結果 | 判定 | 後続方針 |
| --- | --- | --- | --- | --- |
| 全体ナビ | 下部ナビで食材管理/献立・レシピ/料理・記録を切替 | Web版は単一ホーム上に各ワークスペースを縦配置。Canvas版の下部3モード切替とは違う | `changed` | `TKT-0114-web-canvas-mode-navigation` |
| 起動/ログイン | Canvas起動後にGAS初期化 | Web版はログイン後にSupabaseから本人データを初期表示 | `supabase_replace` | 置換として許容 |
| ステータス表示 | 常設ステータス、処理中表示、AIキャンセル、同期状態 | Web版は操作ごとのメッセージ中心。常設ステータスやAIキャンセルは不足 | `partial` | `TKT-0114-web-canvas-mode-navigation` |
| 食材一覧 | 保存場所タブ、使い切り、期限、ソート、選択操作 | 在庫一覧、編集、削除、期限表示はある。保存場所タブ、ソート、一括選択、使い切り導線は不足 | `partial` | `TKT-0115-inventory-staging-canvas-parity` |
| 登録待ち | 画像スキャン、手動追加、AI解析、在庫確定、一括削除 | 手動追加、写真AI解析、在庫確定、個別削除はある。一括削除や登録ハブUIは不足 | `partial` | `TKT-0115-inventory-staging-canvas-parity` |
| 写真AI食材解析 | 写真から候補を作り、登録待ちで確認して在庫化 | Web版は非公開Storage保存、サーバー側Gemini解析、登録待ち追加がある | `supabase_replace` | APIキー非露出方針で許容 |
| 保存場所管理 | 保存場所追加/削除/在庫あり制御 | 自由入力はあるが、保存場所マスタ管理と削除制御がない | `missing` | `TKT-0116-storage-location-management-web` |
| 単位換算 | 在庫に換算情報を持ち、消費時に使う | 在庫/登録待ちに換算情報を保存でき、登録/編集UIで設定できる。調理完了時の実消費連携は `TKT-0125` で扱う | `partial` | `TKT-0125-cooking-completion-consumption-web` |
| 買い物リスト | 出自別表示、手動追加、購入済み、一括削除 | 手動追加、購入済み、選択削除、献立/手動の出自表示を実装済み。出自別グループの細かな見た目は後続UI調整で継続 | `partial` | `TKT-0121-meal-schedule-canvas-parity` |
| 不足食材選択 | タブ付き選択モーダルで買い物追加対象を選ぶ | 選択中献立の不足食材チェックはある。同じ単位だけ比較で、Canvas版の選択モーダルより簡易 | `partial` | `TKT-0118-shopping-list-canvas-parity` |
| レシピ集 | 一覧、詳細、作成、編集、削除、検索、ソート | 作成、編集、一覧、詳細、検索、ソート、2段階削除を実装済み。カード判断材料の強化は継続 | `partial` | `TKT-0120-ai-recipe-generation-web` |
| レシピジャンル | AppSheet風複数選択、並び替え、省略表示 | カンマ区切り入力のみ。Canvas版の複数選択UIとは違う | `changed` | `TKT-0119-recipe-collection-canvas-parity` |
| レシピ材料構造 | 食材/調味料/下準備/調理工程を分離 | Supabase上も `recipe_ingredients.item_type`, `prep_steps`, `steps` で分離済み | `same` | 現状維持 |
| レシピ編集 | 材料/調味料/工程の追加削除、ドラッグ並び替え | 行追加/削除はある。ドラッグ並び替えとCanvas同等の編集UIは不足 | `partial` | `TKT-0119-recipe-collection-canvas-parity` |
| AIレシピ考案 | 期限切れ優先/指定食材/必須任意/AI相談/プレビュー保存 | サーバーAPI経由で必須/任意食材からAIレシピ案を作り、プレビュー後にフォーム反映できる。期限切れ自動選択は後続で強化 | `partial` | `TKT-0123-today-dashboard-web` |
| レシピ本文AI構造化 | テキスト貼り付けからAIでレシピ化 | サーバーAPI経由で本文構造化し、プレビュー後にフォーム反映できる | `same` | 完了 |
| 献立 | 7日表示、日送り、レシピ選択、ドラッグ移動、削除 | 7日表示、前/次の7日移動、日付指定追加、前日/翌日移動、削除を実装済み。ドラッグ移動はスマホ操作を優先しボタン移動で代替 | `same` | `TKT-0121-meal-schedule-canvas-parity` |
| 作りたい候補 | 候補キュー、理由チップ、スケジュール割当 | Web版には候補キューがない | `missing` | `TKT-0122-cook-candidate-queue-web` |
| 今日ダッシュボード | 今日の献立/期限/買い物/同期/候補を統合表示 | 今日の献立、期限が近い在庫、未購入の買い物、作りたい候補を最上部に統合表示。同期パネルはWeb版では不要 | `same` | `TKT-0123-today-dashboard-web` |
| 調理ビューア | 材料/調味料タブ、在庫チェック、手順タブ、材料タップ照合 | レシピ詳細から開ける調理ビューア、材料/調味料、下準備/調理手順、在庫有無、手順内材料チップを実装済み | `same` | `TKT-0124-cooking-viewer-web` |
| 調理完了 | 消費量調整、代替品選択、在庫減算、履歴作成 | 消費量確認、同カテゴリ/同単位の代替在庫選択、在庫減算、料理履歴作成、消費履歴保存を実装済み | `same` | `TKT-0125-cooking-completion-consumption-web` |
| 料理記録 | 写真、評価、感想、履歴保存 | 手動料理履歴、写真圧縮、非公開Storage、評価、メモ保存はある | `supabase_replace` | 置換として許容。ただし調理完了連携は `TKT-0125-cooking-completion-consumption-web` で補う |
| 料理履歴 | タイムライン/カレンダー/分析、検索、フィルタ、写真表示 | タイムライン、カレンダー、分析、検索、評価フィルタ、署名付き写真表示を実装済み | `same` | `TKT-0126-cooking-history-analysis-web` |
| 削除確認 | 独自確認モーダルで統一 | 在庫、登録待ち、保存場所、買い物、レシピ、献立、候補の削除確認パネルを実装済み。履歴は削除UI未提供 | `same` | `TKT-0127-delete-confirmation-web` |
| スマホUI | Canvas版のスマホ前提UI、下部ナビ、安全なタップ領域 | Web版はレスポンシブ前提だが、Canvas同等の下部操作導線ではない | `partial` | `TKT-0114-web-canvas-mode-navigation` と `TKT-0111-pwa-mobile-polish` |
| セキュリティ | APIキーをブラウザへ出さず、写真を非公開で扱う | Gemini APIはサーバー側、写真Storageは非公開bucket + signed URL方針 | `same` | 現状維持。service role key直書き禁止を継続 |
| CSV移行 | 旧SpreadsheetからSupabaseへ移行 | 未移植機能がschemaに影響する可能性あり | `blocked` | TKT-0110は停止 |

## CSV移行前の必須条件

- `missing` と `changed` の後続チケットを完了する。
- `partial` のうち、schemaに関係する単位換算、調理完了、履歴、AI結果、候補、保存場所を先に確定する。
- Supabase schemaがCanvas版の必要データを失わないことを確認する。
- 写真、AI、履歴、消費量、単位換算、候補、今日ダッシュボードの保存先を確定する。

## 後続チケット

| チケット | 優先度 | 内容 | CSV移行への影響 |
| --- | --- | --- | --- |
| `TKT-0114-web-canvas-mode-navigation` | 高 | Canvas同等の全体ナビ、常設ステータス、スマホ導線 | 低。ただし体験差分として先に方針決定が必要 |
| `TKT-0115-inventory-staging-canvas-parity` | 高 | 在庫一覧、登録待ち、保存場所タブ、ソート、一括操作 | 中。保存場所や在庫状態の移行項目確認が必要 |
| `TKT-0116-storage-location-management-web` | 高 | 保存場所マスタ管理、削除制御、在庫あり制御 | 高。移行時の保存場所正規化に影響 |
| `TKT-0117-unit-conversion-web` | 高 | 単位換算schema、UI、消費処理連携 | 高。CSV移行前に必須 |
| `TKT-0118-shopping-list-canvas-parity` | 中 | 買い物リスト手動追加、購入済み、一括削除、出自別表示 | 中。買い物データ移行に影響 |
| `TKT-0119-recipe-collection-canvas-parity` | 中 | レシピ集検索/ソート/削除、ジャンル選択、編集UI | 中。ジャンルと材料順序の移行に影響 |
| `TKT-0120-ai-recipe-generation-web` | 高 | AIレシピ考案、本文AI構造化、プレビュー保存 | 中。AI保存形式とレシピschemaに影響 |
| `TKT-0121-meal-schedule-canvas-parity` | 中 | 7日献立、日送り、ドラッグ移動、削除 | 完了。ドラッグ移動はWeb/スマホ向けに前日/翌日ボタンで代替 |
| `TKT-0122-cook-candidate-queue-web` | 高 | 作りたい候補キュー、理由チップ、献立割当 | 完了。`cook_candidates` tableで保存形式を確定 |
| `TKT-0123-today-dashboard-web` | 中 | 今日ダッシュボード | 低。ただし候補/同期表示の方針に依存 |
| `TKT-0124-cooking-viewer-web` | 高 | 調理ビューア、材料照合、手順タブ | 完了。調理完了時の在庫減算はTKT-0125で扱う |
| `TKT-0125-cooking-completion-consumption-web` | 高 | 調理完了、消費量調整、代替品、在庫減算、履歴作成 | 高。CSV移行前に必須 |
| `TKT-0126-cooking-history-analysis-web` | 中 | 料理履歴タイムライン/カレンダー/分析/検索/フィルタ | 完了 |
| `TKT-0127-delete-confirmation-web` | 低 | 削除確認モーダル統一 | 完了 |

## TKT-0110 CSV移行判定

判定: `止める`

理由:

- 単位換算、保存場所管理、候補キュー、調理完了時の在庫消費が未確定。
- 料理履歴と写真、分析/検索/調理完了連携はWeb版に移植済み。
- AIレシピ考案と本文構造化が未実装で、レシピ保存形式に追加項目が必要になる可能性がある。
- 現時点でCSV移行を作ると、後続実装後に移行スクリプトやSupabase schemaを作り直すリスクが高い。

## 次の作業

1. `TKT-0114` から `TKT-0127` を順に進める。
2. schemaに影響する `TKT-0116` / `TKT-0117` / `TKT-0122` / `TKT-0125` をCSV移行前に必ず完了する。
3. それらの方針確定後に `TKT-0110-csv-migration-tool` を再開する。
