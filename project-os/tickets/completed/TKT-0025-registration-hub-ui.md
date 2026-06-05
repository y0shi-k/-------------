---
id: TKT-0025-registration-hub-ui
title: 食材管理 登録待ちUI再設計
status: implementation_ready
goal: 登録待ち・買い物リスト・追加導線を整理し、食材管理画面の作業フローを分かりやすくする
acceptance:
  - 右上＋で登録待ち画面が開く
  - ヘッダー右上に食材管理・買い物リスト・追加の3タブUIがある
  - ヘッダーのタイトル領域と下部アクション領域はニュートラル背景のまま
  - 3タブでリスト開始位置が揃う
  - アクティブタブに合わせてリスト領域と行背景が同系色になる
  - 保存場所タブに登録待ち・買い物リストが表示されない
  - 登録待ち画面上部から画像スキャン、手動追加ができる
  - 買い物リストはヘッダー右上のタブから確認できる
  - 登録待ち画面下部の在庫追加系操作が主ボタン＋補助操作として表示される
  - 既存の買い物リスト表示切替、購入済、削除、登録待ち一括処理が維持される
  - verify がパスする
required_evals:
  - ui_component_addition
eval_selection_mode: auto
changed_paths:
  - app.html
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0025-inventory-registration-hub-ui
related_artifacts:
  - artifacts/TKT-0025/verify.json
  - artifacts/TKT-0025/manual-smokes.md
  - artifacts/TKT-0025/review.md
  - artifacts/TKT-0025/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - GAS通信、Spreadsheetスキーマ、pendingSync構造は変更しない
---

# Summary

食材管理ヘッダー右上を食材管理・買い物リスト・追加の3タブUIにし、追加タブで登録待ち画面を開く。登録待ち画面上部は買い物リストへの追加導線、下部は在庫追加処理に集約する。

## 実装メモ

- `renderLocationTabs()` から登録待ち・買い物リストのタブ表示を削除する。
- 登録待ち件数はヘッダー＋付近または登録ハブ上部にバッジ表示する。
- 買い物リスト確認は登録ハブ内ではなくヘッダー右上タブに置く。
- 食材管理、買い物リスト、追加の各画面でタブとリスト領域の色を連動させる。
- ヘッダーのタイトル周辺と下部アクション領域は色面に含めない。
- 画面別サブヘッダー枠を固定高さにし、追加タブを含む切り替え時の縦位置ズレを抑える。
- 買い物リスト行は白カードではなく、画面背景と同系統のエメラルド背景に揃える。
- `renderList()` の登録待ち・買い物リスト分岐は維持し、表示部品だけ再配置する。

## 残リスク

- Canvas実機での視覚確認は手動プレビューが必要。
