# TKT-0138 Report

## Summary

Web版の食材管理をCanvas版画像に合わせる方向へ修正した。

## Changes

- 上部3モードナビを削除し、Canvas版と同じ下部ナビに戻した。
- `.app-shell` をCanvas版相当の中央アプリ幅へ戻した。
- 食材管理のタイトル、右側タブ、保存場所タブ、並び順、すべて選択をCanvas版構造へ寄せた。
- 在庫カードを大きな管理画面カードから、Canvas版の横長在庫行へ寄せた。
- 在庫行に数量ステッパー、編集アイコン、削除アイコンを表示した。
- Supabase保存処理、AI解析API、写真Storage処理は変更なし。

## Verification

- lint: passed
- typecheck: passed
- test: 57 passed
- build: passed
- browser smoke: blocked by browser security policy for localhost:3001
