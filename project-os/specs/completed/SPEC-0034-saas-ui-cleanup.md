---
id: SPEC-0034-saas-ui-cleanup
title: SaaSライクUIクリーンアップ
status: spec_ready
scope:
  - app.html のTailwindクラス整理
  - 静的HTMLとJSテンプレートHTML内の表示アイコン整理
constraints:
  - 機能、JavaScriptロジック、GAS通信、データ更新処理は変更しない
  - id、data-*、onclick、onsubmit、onchange、oninput、aria-* 属性は変更しない
  - Spreadsheet 書き込み経路は `state.pendingSync` + `syncPendingChanges()` の手動一括同期を維持する
acceptance:
  - `font-black`、過剰な角丸、強すぎる影、`border-2` がUIから除去されている
  - UI絵文字がinline SVGアイコンへ置換されている
  - 評価表示の星は料理履歴の評価値として維持されている
  - 標準 verify が成功する
related_tickets:
  - TKT-0034-saas-ui-cleanup
---

# Summary

Stock Master の既存UIを、機能変更なしでSaaSライクなモダン・クリーン表現へ整える。AI生成らしい強い太字、過剰な角丸、強い影、絵文字アイコンを抑え、境界線と控えめなシャドウで階層を表現する。

## 仕様

- `app.html` の静的HTMLと `<script>` 内テンプレートHTMLを対象にする
- テキスト階層は `font-medium` と必要箇所の `font-bold` を中心にする
- カード、ボタン、モーダルは `rounded-lg` または `rounded-xl` に統一する
- 境界線は原則 `border` にし、入力フォーカスは `focus:ring-2` を使う
- アイコンは外部ライブラリを追加せず、inline SVGで表現する

## 非対象

- GAS payload、Spreadsheet schema、同期ポリシー
- 関数の条件分岐、状態更新、イベントハンドラ
- 画面構造や操作導線の再設計
