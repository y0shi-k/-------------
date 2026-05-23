---
id: SPEC-0106-mobile-photo-capture-upload
title: スマホ写真取り込みと圧縮アップロード
status: spec_ready
scope:
  - web/
  - Supabase Storage
  - スマホ/タブレット写真UI
constraints:
  - 元画像は原則保存しない
  - 写真Storageは公開しない
  - AI解析は TKT-0107 で扱う
acceptance:
  - スマホ/タブレットで写真を撮れる
  - 画像をプレビューできる
  - 撮り直しできる
  - 圧縮画像だけをStorageへ保存できる
related_tickets:
  - TKT-0106-mobile-photo-capture-upload
---

# Summary

Web版の最重要体験である、スマホやタブレットからの直接写真取り込みを実装する。

## 非対象

- Gemini解析
- 料理履歴との完全連携
- 元画像の保存
