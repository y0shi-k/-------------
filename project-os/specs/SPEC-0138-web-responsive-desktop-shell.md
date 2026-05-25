---
id: SPEC-0138-web-responsive-desktop-shell
title: 食材管理Canvas完全再現レイアウト
status: spec_ready
scope:
  - web/
  - web mode shell
  - inventory workspace
constraints:
  - Supabase保存処理を変更しない
  - GAS/Spreadsheet/Driveは使わない
  - APIキー、Service Role Key、写真URLをブラウザへ出さない
  - 独自のPC向けアレンジや改善を入れない
  - PC表示もCanvas版と同じ中央アプリ幅、下部ナビ、在庫行レイアウトを優先する
acceptance:
  - PC幅でも上部3モードナビを表示しない
  - PC幅でも下部ナビで3画面を切り替える
  - 食材管理のタイトル、画面内タブ、保存場所タブ、並び順、すべて選択、在庫行がCanvas版画像に近い
  - 在庫行はCanvas版と同じく数量ステッパー、編集アイコン、削除アイコンを持つ
  - 食材管理の編集、削除、選択、一括操作、数量変更が壊れない
  - Web版verifyが通る
related_tickets:
  - TKT-0138-web-responsive-desktop-shell
---

# Summary

Web版の食材管理をCanvas版画像に合わせる仕様。

PC向け独自改善は入れず、Canvas版と同じ中央アプリ幅、画面内タブ、下部ナビ、横長在庫行を再現する。
