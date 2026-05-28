---
ticket_id: TKT-0142-web-add-modal-remove-location-manager
status: ready
---

# Report Draft

## 変更目的

Web版の「食材をリストへ」モーダル上部にあった保存場所管理UIを削除し、Canvas版と同じ構成に合わせた。

## 今回追加した安全装置

- 保存場所管理UI（追加input・チップリスト・削除ボタン）を削除し、フォーム内のdatalist入力のみを残した。
- Supabase `storage_locations` テーブルへの書き込み（追加・削除）をWeb版から削除。
- 未使用コード（関数・state・memo）を整理し、lint警告を残していない。
- Canvas版 `app.html` は変更していない。

## 実施した確認

- `npm run lint` — 0 errors, 0 warnings
- `npm run typecheck` — passed
- `npm run test` — 11 test files, 53 tests passed
- `npm run build` — compiled successfully

## 残リスク

- なし。保存場所の追加・削除はCanvas版側で管理される。

## 次の依頼や人判断

- Web版で保存場所の追加・削除が必要になった場合、Supabase経由での管理UIを別途検討する。
