---
id: TKT-0189-cooking-record-photo-viewer
title: 料理記録の複数写真 閲覧導線（カード枚数バッジ＋閲覧モーダル）
status: implementation_ready
goal: カレンダー/タイムラインの料理記録カードで、写真が複数あることを枚数バッジで示し、写真タップで全画像・評価・コメントを読み取り専用で見られる閲覧モーダルを開けるようにする。複数枚を見る場所がない・複数あることに気づけない問題を解消する。
acceptance:
  - 料理記録カード（cooking-history-board.tsx）の写真に、写真が2枚以上のとき枚数バッジ（例「📷2」）が表示される
  - カードの写真をタップ/クリックすると、その記録の閲覧モーダルが開く
  - 閲覧モーダルに、その記録の全画像がグリッド等で表示される（1枚しか無い場合も成立）
  - 閲覧モーダルに評価（★）とコメントが読み取り専用で表示される
  - 閲覧モーダルから「編集」で既存の編集モーダル（CookingRecordEditModal）へ遷移できる
  - 閲覧モーダルは「×」または背景で閉じられる
  - 写真が無い記録ではバッジを出さず、従来どおり「写真なし」表示のままで閲覧モーダルの写真欄が崩れない
  - カレンダー表示・タイムライン表示の両方のカードに適用される
  - 既存の「編集」ボタン・「レシピを見る」導線が従来どおり動作する
  - スマホ幅で閲覧モーダル・バッジが崩れない（横はみ出ししない）
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/cooking-history-board.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0189-cooking-record-photo-viewer/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0189-cooking-record-photo-viewer
related_artifacts:
  - artifacts/TKT-0189-cooking-record-photo-viewer/verify.json
  - artifacts/TKT-0189-cooking-record-photo-viewer/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（JSX＋CSS、読み取り専用表示）。Storage/schema/auth/RLS は無変更。既存の `signed_url`（photos に付与済み）をそのまま表示するだけ。新規 fetch も不要（item.photos に署名URLがある）。
  - `photo_upload_storage` eval が語彙（`photo|image|写真|画像`）で過剰マッチする見込み。実Storage/policy/schema は無変更（表示のみ）。report に「実Storage無変更・既存 signed_url の表示のみ」と明記すれば manual-smokes/review は不要（TKT-0181/0183 と同方針）。
  - カード写真: `HistoryPhoto`（cooking-history-board.tsx ≈L455-469）は現状 1枚のみ表示。複数枚（signed_url を持つ photos が2件以上）のとき枚数バッジを重ねる。写真要素をボタン/クリック可能にして閲覧モーダルを開く。
  - 閲覧モーダル: `CookingHistoryBoard` 内に state（viewingItem: CookingHistoryItem | null）を持ち、新規の読み取り専用モーダルコンポーネントを追加。全 `item.photos`（signed_url あり）をグリッド表示＋`renderStars(item.rating)`＋`item.note`。フッタに「編集」（既存 `onEdit(item)` を流用）と「閉じる」。
  - 既存編集モーダルの呼び出し（`setEditingItem` / `CookingRecordEditModal` ≈L105,357-361）はそのまま。閲覧→編集は viewingItem を閉じて editingItem を立てる。
  - モーダルの a11y: `role="dialog" aria-modal="true"`、×ボタン `aria-label="閉じる"`、背景クリックで閉じる（既存モーダルの canvas-modal / modal-backdrop パターンに合わせる）。
  - APIキー・写真URL・Service Role Key を直書きしない。console.log を残さない。Canvas版 `app.html` は触らない。GAS/Spreadsheet/Drive 不使用。
  - verify は `/verify TKT-0189-cooking-record-photo-viewer`。
---

# Summary

料理記録の複数写真を閲覧する導線を追加する。カレンダー/タイムラインのカードに枚数バッジを出し、
写真タップで全画像・評価・コメントを読み取り専用で見られる閲覧モーダルを新設する。既存の `signed_url` を
表示するだけの非危険変更。閲覧モーダルから既存の編集モーダルへ遷移できる。

## 実装メモ

- プロジェクト名: Stock Master。現役正本（編集対象）は `web/`。
- 編集:
  - `web/src/components/cooking-history-board.tsx`:
    - `HistoryPhoto`（≈L455-469）: signed_url を持つ写真が2件以上のとき枚数バッジを重ねる。写真をクリック可能にし、クリックで閲覧モーダルを開く（onView コールバック）。
    - `CookingHistoryBoard`: `viewingItem` state ＋ 読み取り専用の閲覧モーダルコンポーネントを追加。全画像グリッド＋評価＋コメント、フッタに「編集」（既存 onEdit 流用）と「閉じる」。
    - カレンダーセル/タイムライン両方のカード（≈L398-426 ほか）で写真クリック→onView を配線。
  - `web/src/app/globals.css`: 枚数バッジ、閲覧モーダル（グリッド・大画像）、スマホ幅対応のスタイルを追加。
- 既存パターン参照:
  - モーダル: 既存 `modal-backdrop` / `canvas-modal` / `modal-close-button` パターン（recipe-meal-workspace.tsx / cooking-record-edit-modal.tsx）。
  - 署名URL: `item.photos[].signed_url`（既にボード読み込み時に付与）。
  - 評価表示: `renderStars`（cooking-history-board.tsx 内）。
- 注意:
  - Canvas版 `app.html` / `要件定義書.md` は凍結・参照専用（編集しない）。
  - GAS/Spreadsheet/Driveを使わない。APIキー・Service Role Key を直書きしない。
  - 閲覧モーダルは読み取り専用。削除・追加・保存はしない（それは編集モーダル＝TKT-0188 の責務）。

## 非ゴール

- 編集モーダル側の写真UI改善（既存×削除・新規サムネ）→ TKT-0188。
- 画像の拡大ズーム/スワイプギャラリー等の高度な閲覧（まずはグリッド表示で成立させる。必要なら別チケット）。
- 写真Storage / schema / RLS / バケット設定の変更。

## 依存チケット

- なし（TKT-0188 とは独立。並行可）。

## 残リスク

- signed_url の有効期限切れ表示（既存ボードと同じ挙動。閲覧モーダルでも署名切れ時に壊れない確認）。
- カレンダーセルの狭い枠でのバッジ重なり・タップ領域の確保（スマホ幅）。
