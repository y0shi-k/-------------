# TKT-0251 Report

## 結論

献立スケジュールカードの×ボタンを、カード内右上に収まる見た目へ修正した。

## 変更内容

- `.schedule-meal-card` 自体をカード枠にし、内側の `.schedule-meal-select` は透明な全面ボタンにした。
- `.schedule-meal-delete-button` をカード内右上へ絶対配置した。
- 共通ツールチップCSSが `position` を上書きしていたため、`.schedule-meal-card .schedule-meal-delete-button` で対象を絞って上書きした。
- 375px幅では朝昼晩スロットを縦並びにし、カード幅が潰れて文字と×ボタンが重ならないようにした。

## 確認

- `harness/bin/verify_web.sh TKT-0251-schedule-card-delete-button-placement`: pass
  - lint: pass（既存警告6件あり）
  - typecheck: pass
  - test: pass（52 files / 584 tests）
  - build: pass
  - policy: pass
- Browser確認:
  - PC幅: ×ボタンはカード内右上、カード高さは余計な行なし。
  - 375px幅: カード幅246px、×ボタンはカード内、レシピ名と重ならない。

## セキュリティ

DB schema、Supabase Auth/RLS、Storage、AI API route、APIキー管理には触れていない。

## 残る注意点

verify中に既存のlint警告とテストstderrが出ているが、今回のCSS変更とは別件で、verify結果はpass。
