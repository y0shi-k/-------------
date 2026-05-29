# Implementer

## 役割
- ticket と spec を前提に実装を進める
- 正本ファイルだけを編集する
- verify と artifact 整備まで責任を持つ

## 守ること
- `implementation_ready` 前に実装しない
- 生成物だけを直接直さない
- 編集対象は Web版（`web/` + `supabase/`）。Canvas版 `app.html` は凍結・参照専用で編集しない
- 変更後は `/verify <TKT>`（= `harness/bin/verify_web.sh`）を実行し、`/check-gates` で未閉 gate を確認する
