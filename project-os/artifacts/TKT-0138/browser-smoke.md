# TKT-0138 Browser Smoke

## Environment

- URL: `http://localhost:3001`
- Data state: authenticated local session, inventory/staging counts were 0件

## Desktop

- Viewport: default in-app browser width `1043px`
- `.app-shell`: `1043px`
- inventory panel: `963px`
- `.desktop-mode-nav`: `grid`
- `.bottom-mode-nav`: `none`
- horizontal overflow: none

## Mobile

- Viewport: `390px x 844px`
- `.app-shell`: `375px`
- inventory panel: `343px`
- `.desktop-mode-nav`: `none`
- `.bottom-mode-nav`: `grid`
- document scroll width: `375px`
- horizontal overflow: none

## Latest Result

Codex側のブラウザ操作は、`localhost:3001` 利用がブラウザセキュリティポリシーでブロックされたため未実施。

ユーザー側の in-app browser で以下を確認する:

- 上部3モードナビが表示されない
- 下部ナビがPC幅でも表示される
- 食材管理ヘッダーがCanvas版と同じくタイトル左、タブ右になる
- 保存場所タブ、並び順、すべて選択、在庫行がCanvas版画像に近い
- 在庫行に数量 `- / +`、編集アイコン、削除アイコンが表示される
