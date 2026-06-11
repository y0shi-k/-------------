---
id: TKT-0240-user-synonym-group-merge
title: ユーザー同義語辞書で語が複数行にまたがる場合にグループを連結統合する
status: completed
goal: ユーザー辞書で「A＝B」「B＝C」のように同じ語が複数行に現れたとき、後の行が前の行のグループIDを上書きして A と B の同一視が切れる潜在バグを防ぐ
acceptance:
  - setUserSynonymGroups（web/src/lib/ingredients/name-match.ts）で、正規化後に共通語を持つグループが推移的に1つへ統合される（Union-Find か逐次マージ。例 A＝B / B＝C → {A,B,C}）
  - 既存のイミュータブル方針を維持（Map/配列の mutate ではなく新規構築で差し替え）
  - 既存挙動の回帰なし: 静的辞書とユーザー辞書をまたぐ同一視はしない、空グループ・1語グループは無視、normalizeIngredientMatchName 経由の正規化照合
  - 単体テスト追加: 「A＝B / B＝C で A↔C が一致」「独立グループは混ざらない」「同義語スクリーンショット相当の重複4行でも一致」
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/lib/ingredients/name-match.ts
  - web/src/__tests__/name-match.test.ts
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0222-ingredient-name-matching
related_artifacts:
  - artifacts/TKT-0240-user-synonym-group-merge/verify.json
  - artifacts/TKT-0240-user-synonym-group-merge/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0240`（= `harness/bin/verify_web.sh`）
  - 純粋ロジックのみの非危険変更。必須成果物は verify.json + report.md
---

# Summary

2026-06-11 の不具合調査（豚こま肉マッチング）で副次的に発見した潜在バグの修正。今回のユーザーデータ（豚コマ系4行）は偶然すべて同一ペアに正規化されるため実害はなかったが、辞書仕様として連結グループを正しく扱う。

## 原因（調査済み）

- `setUserSynonymGroups` は行（グループ）ごとに `user:${idx}` を振り、`map.set(正規化語, groupId)` で登録する。同じ語が複数行に出ると後の行の ID で上書きされ、先の行の相方と同一視が切れる。

## 実装メモ

- 対象は `web/src/lib/ingredients/name-match.ts` の setUserSynonymGroups のみ（user-synonyms.ts の parse/IO は変更不要）
- マージは正規化後の語をキーに行う（豚コマ と 豚こま は同一キー）
- 既存テストファイルの構成・命名に合わせる（name-match.test.ts があるか確認し、なければ既存テストの置き場所規約に従う）

## 残リスク

- なし（純粋関数の挙動改善。静的辞書には影響しない）
