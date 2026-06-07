---
ticket_id: TKT-0205-cooking-history-client-signing
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

料理履歴の完成写真を、`web/src/app/page.tsx` のサーバ署名（`createSignedUrl`、30分TTLの新トークン）依存から、
クライアントの共有キャッシュ（TKT-0203 `useCachedSignedUrls`）解決へ移す。これにより、在庫更新などで
`router.refresh()` が走るたびに新しい署名URLが発行されブラウザ側で再ダウンロードになっていた挙動を解消する。
あわせて「写真あり」判定を署名URLの有無ではなく `storage_path` の有無ベースに統一する。

## 今回追加した安全装置

- 「写真あり」判定を `storage_path` 有無ベースに統一（署名URLの発行可否に依存しないため、初回SSR時に署名が
  無くても件数バッジ・カレンダー代表写真選択・タイムライン「写真あり」タグ・インサイト件数が正しく出る）。
- 署名URL未解決時（初回レンダリング直後の非同期解決待ち）は `<img>` を出さず「写真なし」/「読み込み中…」の
  フォールバック表示にして、壊れた画像アイコンが出ないようにした。
- `storage_path` は非公開バケット前提で、署名なしでは取得不可。クライアント解決でも `useCachedSignedUrls` が
  Supabase の署名APIを通すため、本人以外がURLを取得できる経路は増えていない（RLS・バケット公開設定は無変更）。
- 型 `web/src/lib/cooking-history/types.ts` の `signed_url` を `@deprecated` 明示（互換のため optional 維持）、
  `storage_path` を表示の起点とコメントで明文化。波及参照は typecheck（0エラー）で確認。

## 実施した確認

- `/verify TKT-0205-cooking-history-client-signing`: **status=pass**（lint / typecheck / test / build すべて pass、
  policy: no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean すべて pass）。
- 既存テスト `web/src/__tests__/cooking-history-board.test.tsx`（9件）が、表示経路変更（`signed_url` 直参照 →
  `useCachedSignedUrls` 解決）に追従するようモックを追加して全件 pass。全体 301 tests pass。
- 静的確認: `home-dashboard.tsx` は料理履歴写真を表示していない、`recipe-meal-workspace.tsx` は
  `CookingHistoryPhoto.signed_url` を直接参照していない（ローカルobjectURL と TKT-0204 候補写真のみ）ことを確認し、
  acceptance の対象から外して変更しないことを判断（report に記録）。

## 残リスク

- **実機スモーク未実施（pending）**: 下記は dev サーバ＋ブラウザでの手動確認が必要。詳細は `manual-smokes.md` 参照。
  - カレンダー代表写真 / タイムラインサムネ / インサイト「写真で見る今月」グリッド / 編集モーダル既存写真 /
    レシピ完成写真プレビューの表示崩れがないこと。
  - 在庫更新等で `router.refresh()` が走った後、料理履歴の完成写真が再ダウンロードされず DevTools Network で
    `from cache` で出ること。
  - 未ログイン・本人以外のデータが表示されない（表示経路変更による回帰がないこと）。
- 初回SSR直後の一瞬、署名URL解決完了までフォールバック表示になる（仕様として許容）。

## 次の依頼や人判断

- 上記 pending の実機スモークをユーザー（または別セッションで dev 起動可能な環境）で実施し、`manual-smokes.md` の
  executed_checks を更新する。崩れ・再DL継続が見つかった場合は当チケットへ差し戻し。
- 危険eval（`supabase_schema_change` / `photo_upload_storage`）は `/check-gates` の語彙過剰マッチであり、
  実際の Storage セキュリティ・RLS・バケット公開設定・アップロード経路は無変更（読み取り経路の変更のみ）。
