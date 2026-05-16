---
ticket_id: TKT-0029-background-activity-status
status: ready
---

# 変更目的

写真やデータを裏で読み込んでいる時に、ユーザーが何が起きているか分かるようにしました。

# 今回追加した安全装置

- 画面下部に、処理内容を表示する軽量ステータスバーを追加しました。
- ステータスバーは操作をブロックしません。
- 写真枠内にもスピナー付きの「写真を取得中」を表示します。
- Drive共有設定やスプレッドシート書き込みは追加していません。

# 実施した確認

- 標準 verify: `VERIFY_PASSED`
- JavaScript構文チェック: `JS_PARSE_PASSED`
- `setSharing` / `ANYONE_WITH_LINK` がないことを確認
- `alert` / `confirm` / `prompt` がないことを確認

# 残リスク

- 実際の表示位置や見え方はCanvasプレビューで確認が必要です。

# 次の依頼や人判断

- Canvasで料理履歴を開き、写真枠内の読み込み表示と下部ステータスが自然に出るか確認してください。
