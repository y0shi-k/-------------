# Backlog（マクロ層: 今 / 次 / 優先順位）

> 「現在のフォーカス」と「次にやる候補」の live な正本。短く保つ。詳細はチケットへ。
> 長期ロードマップは `project-os/knowledge/phase-map.md`、決定経緯は `decisions.md` を参照。
> 着手時にここの「次」を見て `/new-ticket` する。完了時に `/finalize` がここを更新する。

## 現在のフォーカス
- 公開前セキュリティ整備（TKT-0149/0150/0151）が一段落。次は本番Supabase/Vercelへの適用・手動確認。
- (TKT-0154) 数量・単位入力のUX改善（単位ピッカー／単位換算の上単位連動／数量スピン1刻み／数値欄IMEオフ）。spec_ready・実装はCodexで実施予定。
- (TKT-0155) 完了。レシピ編集モーダルの材料行レイアウト改善（TKT-0154の単位ピッカーが64px列で縦積み崩れ→モーダル720px化＋単位列拡大＋nowrap化、CSSのみ）。verify pass。目視確認は手元dev推奨。
- (TKT-0156) 完了。消費量調整画面で調味料が分類されない不具合の修正。原因①履歴編集が在庫categoryで分類→レシピ材料 item_type 由来へ統一（完了画面と一致）。原因②AI生成プロンプトに調味料分類指示を追加。スキーマ変更なし。verify pass・全gate閉。実機目視と既存AI生成レシピの再分類（データ移行要否）は残課題。

## 次にやる候補（優先度つき・要ユーザー確認）
1. (P1) 公開前の本番適用ゲート — Supabase Dashboard Auth設定（TKT-0149）、`ai_usage_events` migration適用（TKT-0151 `supabase db push`）、実DB/実機での手動スモーク。
2. (P2) 横断リスク対応 — 緩いCSP（`unsafe-inline`/`unsafe-eval`）× localStorageのGeminiキー保存（XSS時の鍵流出）。CSP nonce化 or sessionStorageオプションを別チケットで検討。
3. (P2) 画像スキャンからのAI一括登録（参照: phase-map「画像スキャン」, TKT-0003系）。
4. (P3) `ai_usage_events` の古い行の定期削除（保全）。
5. (P3) Canvas版CSV → Supabase 移行（危険変更: `csv_import_migration`）。

> 上記の並びは仮。実際の優先順位はユーザーが確定する。

## 保留 / 却下
- （なし。却下の理由は decisions.md に残す）
