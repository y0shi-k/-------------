# TKT-0247 report

## 結論

レシピ編集モーダルの材料・調味料行で、品名変更のたびに行DOMが作り直される原因を修正した。

## 変更内容

- `web/src/components/recipe-meal-workspace.tsx`
  - 材料/調味料行の `key` を `tone-index-ingredient.name` から `tone-index` に変更。
  - 入力中に変わる `ingredient.name` を `key` から外し、品名入力・Backspaceで行が再マウントされないようにした。
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - 材料/調味料の品名・数量・単位検索で、文字入力と削除後に `document.activeElement` が同じ入力欄のまま残るテストを追加。

## 静的確認

- レシピ名、出典は親要素に入力値由来の `key` なし。
- ジャンル検索は `GenreTagPicker` 内の候補・選択済みタグに `key={genre}` があるが、検索入力欄自体の親 `key` ではない。
- 下ごしらえ、調理工程は `key={prep-${index}}` / `key={cook-${index}}` で、入力中の `step` 文字列は `key` に使っていない。
- 材料/調味料の行追加・削除・D&D・グルーピング/解除・保存時の `sort_order` 採番に関わるデータ構造は変更していない。
- DB schema、Supabase Auth/RLS、Storage、AI API route は変更していない。
- Canvas版 `app.html` は変更していない。

## 検証

- 対象テスト:
  - `npm test -- src/__tests__/recipe-meal-workspace.test.tsx -t "keeps focus while editing recipe ingredient and seasoning rows"`: pass
- Web版 verify:
  - `harness/bin/verify_web.sh TKT-0247-recipe-ingredient-editor-focus-stability`: pass
  - lint: pass
  - typecheck: pass
  - test: pass（51 files / 566 tests）
  - build: pass
  - policy: no GAS dependency / no hardcoded secret / Supabase RLS present / backlog focus lean all pass

## 残メモ

- verify中に既存のlint warningが6件出ているが、今回変更によるerrorはなし。
- 既存テスト内で同一 `schedule-1` key のReact warningが出ているが、今回の材料/調味料行key修正とは別件。
