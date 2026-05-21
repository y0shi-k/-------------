# Manual Smokes: TKT-0074

## Static Smokes Done

- [x] HTML parser verify passed.
- [x] JavaScript parse check passed.
- [x] Native dialog scan found no `alert` / `confirm` / `prompt`.
- [x] Diff scan found no new `executeGAS`, `appendRow`, `setValue`, `setValues`, `pendingSync`, or `syncPendingChanges` changes.
- [x] Spreadsheet schema was not changed.
- [x] Calendar schedule detail rendering was added without changing save or sync paths.

## Canvas Manual Smokes For User

- [ ] モードCを開き、上部に今月/今週/写真あり率/よく作る料理のサマリーが表示される。
- [ ] `カレンダー / タイムライン / 振り返り` の切り替えができる。
- [ ] カレンダーで日付をタップすると、その日の記録一覧が下に出る。
- [ ] 予定のみの日をカレンダーで選ぶと、下部に食事区分とレシピ名が表示される。
- [ ] 記録と予定が両方ある日を選ぶと、下部に予定カードと記録カードが両方表示される。
- [ ] 予定も記録もない日を選ぶと、空表示が崩れない。
- [ ] 予定カードの `レシピを見る` / `調理を開始` が既存導線を壊さない。
- [ ] タイムラインで検索、期間、評価、写真、ジャンル、献立枠の絞り込みができる。
- [ ] 振り返りに頻出料理、高評価、しばらく作っていない料理、ジャンル傾向、今月の写真が出る。
- [ ] 履歴がない状態でも空表示が崩れない。
