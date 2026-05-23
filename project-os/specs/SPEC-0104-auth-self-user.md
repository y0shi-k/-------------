---
id: SPEC-0104-auth-self-user
title: 自分だけログイン
status: spec_ready
scope:
  - web/
  - Supabase Auth
  - 認証ガード
constraints:
  - 未ログインで個人データを表示しない
  - 初期は家族共有や複数ユーザー権限管理を作り込まない
  - service role keyをブラウザ側で使わない
acceptance:
  - ログイン画面がある
  - 未ログインではアプリ本体に入れない
  - ログアウトできる
  - セッション復元後も本人データだけ扱う
related_tickets:
  - TKT-0104-auth-self-user
---

# Summary

Web版を自分だけが安全に使える状態にする。写真や食材データを扱う前に、ログイン保護を先に固める。

## 非対象

- 家族共有
- 招待機能
- 管理者画面
