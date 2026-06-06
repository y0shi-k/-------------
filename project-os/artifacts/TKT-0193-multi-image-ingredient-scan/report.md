---
ticket_id: TKT-0193-multi-image-ingredient-scan
status: ready
---

# 実装レポート

## 変更目的

食材追加の画像スキャンで複数画像を一度に選択し、画像ごとに保存・AI解析した結果を1つの候補一覧で確認・登録できるようにした。

## 今回追加した安全装置

- APIは既存の `photoId` を維持しつつ、新しく `photoIds` を受ける。
- 写真ごとに `consumeAiUsage` を実行し、Storage download / Gemini通信失敗時は `refundAiUsage` する。
- 一部画像の保存・解析に失敗しても、成功した画像の候補は一覧に出す。
- 全画像が失敗した場合は候補を出さず、原因・影響・修正方法が分かるエラーを出す。
- Gemini APIキーはDB保存せず、フロントからGoogle APIへ直接送らない。API Routeからのみ送る。
- 写真URLやStorage pathを候補レスポンスや画面表示に混ぜない。

## 実施した確認

- `npm test -- ingredient-scan scan-ingredients-route inventory-board`: pass
- `harness/bin/verify_web.sh TKT-0193-multi-image-ingredient-scan`: pass
- `manual-smokes.md`: pass
- `review.md`: pass
- verify結果は `project-os/artifacts/TKT-0193-multi-image-ingredient-scan/verify.json` に保存済み。

## 残リスク

- 実機スマホでの複数写真選択は未確認。端末によって `capture` と `multiple` の扱いが違う可能性がある。
- 一部失敗時は失敗枚数だけを表示し、失敗した写真の個別特定はしない。
- lint/buildで既存の `_removed` 未使用 warning が2件出ているが、verify全体はpass。

## 次の依頼や人判断

- 実機で「ギャラリーから複数選択」と「カメラ撮影」の挙動を確認すると安心。
