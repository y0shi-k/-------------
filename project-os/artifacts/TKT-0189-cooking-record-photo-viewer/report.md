---
ticket_id: TKT-0189-cooking-record-photo-viewer
status: done
verified_at: 2026-06-06T19:55:57+09:00
---

# 実装報告

料理記録カードで複数写真に気づけるようにし、写真タップで読み取り専用の閲覧モーダルを開けるようにしました。

## 変更内容

- `web/src/components/cooking-history-board.tsx`
  - 写真付きカードのサムネイルをクリック可能にしました。
  - signed_url を持つ写真が2枚以上ある場合、カード写真に `📷2` のような枚数バッジを表示します。
  - 閲覧モーダルを追加し、全写真・評価・コメントを読み取り専用で表示します。
  - 閲覧モーダルの「編集」から既存の `CookingRecordEditModal` へ遷移できるようにしました。
  - 写真なし記録は従来どおり「写真なし」の表示のままです。
- `web/src/app/globals.css`
  - 枚数バッジ、写真ボタン、閲覧モーダル、スマホ幅の折り返し表示を追加しました。
- `web/src/__tests__/cooking-history-board.test.tsx`
  - 複数写真バッジ、閲覧モーダル、閲覧から編集への遷移をテストしました。
- `project-os/specs/SPEC-0189-cooking-record-photo-viewer.md`
  - チケットが `implementation_ready` だったため、必須ゲートに合わせて `spec_ready` へ更新しました。

## セキュリティ

- Storage / schema / RLS / auth / バケット設定は変更していません。
- 新規 fetch は追加していません。既存の `item.photos[].signed_url` を表示するだけです。
- APIキー、Service Role Key、写真URLの実値は直書きしていません。
- Canvas版 `app.html` は編集していません。

## 確認結果

- `npm run test -- cooking-history-board.test.tsx`: pass（9件）
- `harness/bin/verify_web.sh TKT-0189-cooking-record-photo-viewer`: pass
  - lint: pass
  - typecheck: pass
  - test: pass（33 files / 227 tests）
  - build: pass
  - policy: pass（no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean）

verify結果は `project-os/artifacts/TKT-0189-cooking-record-photo-viewer/verify.json` に保存済みです。

## 補足

- verify中に `recipe-meal-workspace.test.tsx` の既存テストで `schedule-1` の重複key警告が出ています。今回の変更対象ではなく、テスト結果はpassです。
- `photo_upload_storage` に関係する語彙を含む変更ですが、実Storage処理は変更していません。既存の署名付きURLを画面表示に使うだけです。
