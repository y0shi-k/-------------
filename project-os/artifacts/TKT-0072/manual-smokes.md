---
ticket: TKT-0072-schedule-controls-spacing
status: done
tester: codex-static
---

# Manual Smokes

## Static Smoke

- [x] スケジュール分岐で `recipeSecondaryRow` の固定 `h-20` を解除している。
- [x] スケジュール分岐で `recipeSelectRow` を `hidden` にし、「7日分」行を描画していない。
- [x] 同期説明文を選択モード行の右端へ移動している。
- [x] 選択モードOFF/ON、1件以上選択時も、選択中件数と選択削除ボタンの既存条件を維持している。

## User Canvas Smoke

- [ ] Gemini Canvas 実表示でスケジュール画面を開き、選択モード行から一覧までの余白が詰まっていることを確認する。
- [ ] 選択モードOFF、ON、1件以上選択時に右端の同期説明文と選択削除ボタンが崩れないことを確認する。
