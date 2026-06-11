---
id: TKT-0222-ingredient-name-match-util
title: 食材名マッチングユーティリティ新設（正規化＋類義語辞書＋部分一致スコア）
status: completed
goal: 「たまご」と「卵」のような表記ゆれでレシピ食材と在庫が紐付かない問題の土台として、共通の名前マッチング関数を新設する。
acceptance:
  - "`web/src/lib/ingredients/name-match.ts` を新設し、次の3関数を export する: ①`normalizeIngredientMatchName(name)`（NFKC正規化・小文字化・空白除去・カタカナ→ひらがな変換） ②`matchesIngredientName(a, b)`（正規化一致 or 類義語辞書一致で true） ③`ingredientNameMatchScore(a, b)`（完全一致 > 正規化一致 > 辞書一致 > 部分一致 > 不一致 の序列を返す。並び順用）"
  - 類義語辞書は同義グループの静的配列として定義し、最低限「卵=玉子=たまご」「玉ねぎ=たまねぎ=玉葱=オニオン」「じゃがいも=ジャガイモ=馬鈴薯=ポテト」「ねぎ=長ねぎ=青ねぎ=万能ねぎ」「ピーマン=パプリカを含めない」等、主要食材10グループ以上を収録する（グループ内の語は正規化後の表記で持つ）
  - "ユニットテストで次を検証: たまご/卵/玉子 が相互に matches=true、タマゴ/たまご が true（カナ→かな）、全角/半角・空白ゆれが true、豚肉/豚こま切れ肉 は matches=false かつ score が不一致より高い（部分一致スコア）、無関係な名前（卵/牛乳）は matches=false かつ score=不一致"
  - "`matchesIngredientName` が部分一致だけでは true を返さないことをテストで固定する（買い忘れ防止のユーザー確定方針）"
  - 既存の画像用 `normalizeIngredientName`（`web/src/lib/ui/ingredient-image.ts`）の挙動・テストに影響がない
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/lib/ingredients/name-match.ts
  - web/src/__tests__/ingredient-name-match.test.ts
  - project-os/artifacts/TKT-0222-ingredient-name-match-util/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0222-ingredient-name-matching
related_artifacts:
  - artifacts/TKT-0222-ingredient-name-match-util/verify.json
  - artifacts/TKT-0222-ingredient-name-match-util/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0222`。コマンドの正本は `harness/registry.json`
  - 非危険変更（純粋なクライアントロジック＋テストのみ）。DB schema / Auth・RLS / Storage / AI route / CSV移行は触らない
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

レシピ食材名と在庫名の照合が完全一致のみ（SPEC-0222 参照）。本チケットはその土台となる
共通マッチングユーティリティを新設する。UIへの適用は TKT-0223（消費量調整）/ TKT-0224（買い物不足計算）。

## 参照すべき既存実装

- `web/src/lib/ui/ingredient-image.ts:211-213` `normalizeIngredientName()`: NFKC＋小文字化＋空白除去の前例。
  ただし**画像分類用なので流用・変更しない**（本チケットでは別関数として新設。カタカナ→ひらがな変換を追加）。
- `web/src/lib/ui/ingredient-image.ts:26-153` `IMAGE_RULES.keywords`: 類義語の語彙集めの参考。
  ただし粒度が粗い（beef に「肉」単体、fish に鮭/さば同居）ため**辞書としては流用しない**。
- テストの置き場・書き方の前例: `web/src/__tests__/cooking-history-edit.test.ts`（vitest）。

## 実装メモ

- カタカナ→ひらがな変換は code point シフトで実装する（U+30A1〜U+30F6 を -0x60）。
  長音「ー」(U+30FC) はシフト対象外なのでそのまま残す。
- 辞書は `readonly string[][]`（同義グループの配列）で持ち、モジュール初期化時に
  「正規化済み語 → グループID」の Map を組んで O(1) 照合にする。
- `ingredientNameMatchScore` の部分一致は「正規化後に一方が他方を含む」判定。
  返り値は序列が分かる数値 or union 型（例: 4=完全一致, 3=正規化一致, 2=辞書一致, 1=部分一致, 0=不一致）。
  **matches（同一視）は 2 以上のみ**。この境界が SPEC-0222 のユーザー確定方針の核。
- 関数は純粋関数にし、引数の配列・オブジェクトを変更しない。
- APIキー・秘匿情報は扱わない。GAS/Spreadsheet/Drive は使わない。

## 非ゴール

- 消費量調整・買い物不足計算への適用（TKT-0223 / TKT-0224）。
- 画像 resolver・絵文字 resolver の挙動変更。
- 単位換算をまたぐ照合（個↔g）。
- 辞書のユーザー編集UI・DB保存。

## 依存チケット

- なし（本イニシアチブの土台。最初に実施する）
