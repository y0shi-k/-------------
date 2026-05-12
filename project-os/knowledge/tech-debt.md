# 技術的負債・既知のTODO

## 現状の負債一覧

| 項目 | 状況 | 備考 |
|---|---|---|
| `GAS_URL` がソース内にハードコードされている | 継続 | Canvasアプリの制約上、現状維持とする |
| `batchPredictAI` 内の `apiKey` が空文字のまま | 継続 | Canvasアプリの制約上、現状維持とする。実運用時はGAS側でプロキシしキーを隠蔽することを推奨 |
| ボトムナビゲーションバー未実装 | Phase2/3必須 | `project-os/tickets/TKT-0002-bottom-navigation.md` で管理 |
| 画像スキャン（Geminiマルチモーダル）未実装 | Phase1残存 | `project-os/tickets/TKT-0003-image-scan-registration.md` で管理 |

## 更新ルール

- 負債が解消されたら本ファイルから削除する（残さない）。
- 新たな負債が発生した場合、まずチケット化を検討し、一時的なものだけここに記載する。
- 恒久対応が必要な負債は必ず `project-os/tickets/TKT-*.md` を作成する。
