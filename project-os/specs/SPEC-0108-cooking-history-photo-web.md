---
id: SPEC-0108-cooking-history-photo-web
title: 料理履歴と完成写真のWeb版移植
status: spec_ready
scope:
  - web/
  - cooking_history
  - photos
constraints:
  - 写真は圧縮済みのみ保存する
  - Storageは公開しない
  - レシピ/献立の全移植は TKT-0109 で扱う
acceptance:
  - 料理履歴を作成・表示できる
  - 完成写真を添付できる
  - 履歴画面で写真を表示できる
  - 写真なし履歴も扱える
related_tickets:
  - TKT-0108-cooking-history-photo-web
---

# Summary

料理完了時の記録と完成写真をWeb版へ移す。写真保存はTKT-0106の仕組みを再利用する。

## 非対象

- 献立からの完了連携全体
- レシピ詳細の完全移植
