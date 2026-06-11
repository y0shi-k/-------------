---
ticket_id: TKT-0240-user-synonym-group-merge
status: ready
---

# Report

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

2026-06-11 の豚こま肉マッチング調査で副次的に発見した潜在バグの修正。ユーザー同義語辞書（`setUserSynonymGroups`）は行ごとに `user:${idx}` を振って `map.set` していたため、同じ語が複数行に出ると後の行の ID が前の行を上書きし、先の行の相方との同一視が切れていた（例: 「A＝B」「B＝C」と書くと A↔B が切れる）。今回のユーザーデータ（豚コマ系4行）は偶然すべて同一ペアに正規化されるため実害はなかったが、辞書仕様として連結グループを正しく扱うようにする。

## 変更内容

- `web/src/lib/ingredients/name-match.ts`
  - `setUserSynonymGroups` を Union-Find（path compression つき）による推移的統合に変更。全行の正規化済み語を頂点として登録し、各行内で unite → 最後に `find(語)` の根を `user:${root}` 形式のグループIDとして新規 Map を構築して差し替え
  - 静的辞書（SYNONYM_MAP）・照合関数（matchesIngredientName / ingredientNameMatchScore）・静的↔ユーザー辞書をまたぐ同一視をしない既存仕様は無変更
  - イミュータブル方針維持: 入力引数・既存 `userSynonymMap` は mutate せず新規 Map を構築（Union-Find 内部の parent Map 更新はデータ構造維持に必要な内部操作）
- `web/src/__tests__/ingredient-name-match.test.ts`
  - 新規5件: ①A＝B/B＝C で A↔C 一致（推移的統合） ②独立グループは混ざらない ③豚コマ系の重複4行（ユーザーのスクリーンショット相当）でも一致 ④3語以上の連鎖で全ペア一致 ⑤空グループ・1語グループは無視

## 今回追加した安全装置

- 上記テスト5件を含む `ingredient-name-match.test.ts` 61件・`user-synonyms.test.ts` 24件 全パス（回帰なし）

## 実施した確認

- `bash harness/bin/verify_web.sh TKT-0240` → lint / typecheck / test / build / policy すべて pass
- オーケストレーターによる diff レビュー: グループIDが `user:` 名前空間を維持し静的辞書（数値ID）と衝突しないこと、`parse`/localStorage IO（user-synonyms.ts）が無変更であることを確認

## 残リスク

- なし（純粋関数の挙動改善。auth / RLS / Storage / AI route / schema に非接触）

## 次の依頼や人判断

- なし（ユーザー操作の変更もなし。辞書に「A＝B」「B＝C」と分けて書いても繋がるようになった、という挙動改善のみ）
