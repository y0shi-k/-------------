---
id: SPEC-0065-genre-summary-fallback-render
title: レシピ一覧ジャンル要約の初期表示欠落を防ぐ
status: spec_ready
scope:
  - レシピ集一覧カードのジャンル要約表示
constraints:
  - レシピジャンルの保存形式は変更しない
  - SpreadsheetスキーマとGAS通信パターンは変更しない
  - ブラウザ実操作テストはユーザーが実施する
acceptance:
  - 幅計測処理が遅れても、ジャンル要約が初期HTMLとして表示される
  - 初期表示は最大3件 + `+N` の安全なフォールバックになる
  - 幅計測後は空き幅に応じた可変表示へ更新される
related_tickets:
  - TKT-0065-genre-summary-fallback-render
---

# Summary

TKT-0064でジャンル要約を幅計測後に後挿入する方式にした結果、Canvas上で計測処理が走らない/遅れる場合にジャンルが空表示になるリスクが出た。初期HTMLに可視フォールバックを入れ、計測後に可変表示へ更新する。
