---
ticket_id: TKT-0220-amount-badge-svg-background
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

調理ビューの手順内分量バッジ（`.cooking-amount-chip`）が色だけでは大さじ/小さじを一目で見分けにくかった。サンプルSVG（大/小）をバッジ背景に敷いて直感的に識別できるようにした。

- `web/public/images/badges/tablespoon.svg`（新規）: 赤系 `#b91c1c` のスプーン図形＋「大」文字。図形 `opacity="0.12"`・文字 `opacity="0.20"` の淡色で前面テキストを邪魔しない。
- `web/public/images/badges/teaspoon.svg`（新規）: 青系 `#1d4ed8` の小さめスプーン図形＋「小」文字。同様の低 opacity。
- `web/src/app/globals.css`: `[data-unit="大さじ"]` / `[data-unit="小さじ"]` に複合背景を追加（例: `background: url('/images/badges/tablespoon.svg') right center / auto 80% no-repeat, #fee2e2;`）。文字とSVGが被らないよう `padding-right: 24px` を追加。

## 今回追加した安全装置

- 既存の単色背景（大さじ=`#fee2e2`/小さじ=`#dbeafe`）と文字色（`#b91c1c`/`#1d4ed8`）は複合指定の中で維持し、コントラストを確保。
- その他単位（グレー系）のセレクタは無変更で、背景SVGは付かない。
- ピル形状（`border-radius: 999px`）・サイズ・行内配置はベースセレクタ `.cooking-amount-chip` のままで、上書きしていない。
- バッジ抽出ロジック（`chipifyStep` の正規表現）には手を入れていない。

## 実施した確認

- `/verify TKT-0220`: lint / typecheck / test（37ファイル・323件全パス）/ build すべて pass。policy も pass。`verify.json` 参照。

## 残リスク

- SVG の opacity・サイズ・`padding-right` はサンプル前提の値。実機目視で調整が必要になる可能性があるが、CSS単独の軽量変更で対応可能。

## 次の依頼や人判断

- なし。`/check-gates` の photo_upload_storage / supabase_schema_change は diff 内「image/画像」語の自動マッチで、本チケットは **public 配下の静的SVG追加＋CSS背景指定のみ**。Supabase Storage・schema・auth は無関係（manual-smokes.md / review.md に詳細）。
