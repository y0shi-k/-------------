---
id: SPEC-0193-multi-image-ingredient-scan
title: 食材追加のAI画像スキャンで複数画像を一括解析する
status: draft
scope:
  - 食材追加の画像スキャンUI
  - `POST /api/ai/scan-ingredients`
  - Gemini食材解析リクエスト
  - AI利用回数の画像枚数分カウント
constraints:
  - 写真は非公開Supabase Storageに保存する
  - Gemini APIキーはDBに保存せず、ブラウザからGoogle APIへ直接送らない
  - AI結果は直接在庫化せず、必ず候補確認を挟む
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
acceptance:
  - 食材追加の画像スキャンで複数画像を選べる
  - 選んだ各画像が非公開Storageへ保存され、各画像がAI解析される
  - AI利用回数は画像枚数分として扱われる
  - 複数画像の解析結果が1つの候補一覧にまとまる
  - 一部画像の解析に失敗しても、成功した画像の候補は確認・登録できる
  - 全画像が失敗した場合は、原因・影響・修正方法が分かるエラーを出す
  - APIキー、写真URL、Storageパス、Service Role Key を直書きしない
  - Web版verifyと危険変更のmanual smoke/reviewが通る
related_tickets:
  - TKT-0193-multi-image-ingredient-scan
---

# Summary

食材写真を複数枚まとめて選び、各写真をAI解析して候補一覧に統合する。写真・AI・利用回数を扱うため、安全性と失敗時の扱いを明確にする。

## 仕様

- 対象はWeb版 `web/`。
- UI:
  - file input を複数選択対応にする。
  - 選択済み画像の枚数とプレビューを表示する。
- API:
  - 既存の `photoId` 単体を保ちつつ、`photoIds` 複数を受けられるよう拡張する。
  - 画像ごとにAI利用回数を予約・消費する。
  - 成功候補と失敗情報を返し、フロントは成功分だけ候補一覧へ出す。
- セキュリティ:
  - Storageは非公開。
  - APIキーは保存しない。
  - AIレスポンス内の不要な個人情報を候補へ混ぜない。

## 非対象

- AI候補の個別編集改善（TKT-0191）
- 分数解釈（TKT-0190）
