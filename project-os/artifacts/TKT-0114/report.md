# TKT-0114 Report

## 実装内容

- Web版ホームをCanvas版に合わせた3モード構成へ変更した。
- `食材管理`、`献立・レシピ`、`料理・記録` を切り替えるクライアント部品を追加した。
- スマホ向けの下部固定ナビを追加した。
- 現在モードと件数を表示する常設ステータスを追加した。
- モード切替のテストを追加した。

## 変更ファイル

- `web/src/app/page.tsx`
- `web/src/app/globals.css`
- `web/src/components/web-mode-shell.tsx`
- `web/src/__tests__/web-mode-shell.test.tsx`
- `project-os/artifacts/TKT-0114/`

## verify

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed
- `npm run build`: passed
