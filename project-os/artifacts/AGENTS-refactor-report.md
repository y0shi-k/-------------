---
report_type: refactor
subject: AGENTS.md 構造圧縮と情報の段階提示化
date: 2026-05-12
---

## 変更概要

AGENTS.md を 231行 → 33行に圧縮し、詳細情報を `.agents/rules/` と `project-os/knowledge/` へ段階的に移行した。

## 新規作成ファイル

| ファイル | 内容 |
|---|---|
| `.agents/rules/tech-stack.md` | 技術スタック・Canvasアプリの絶対制約 |
| `.agents/rules/coding-standards.md` | コーディング規約・命名・Tailwindクラス例・日付フォーマット |
| `.agents/rules/schema.md` | データベーススキーマ（5シート・変更禁止） |
| `project-os/knowledge/phase-map.md` | Phase1〜3の機能マップ。TODOは個別チケットへ委譲 |
| `project-os/knowledge/tech-debt.md` | 既知の技術的負債。チケット管理への誘導付き |
| `project-os/tickets/TKT-0002-bottom-navigation.md` | ボトムナビゲーションバー（未実装機能のチケット化） |
| `project-os/tickets/TKT-0003-image-scan-registration.md` | 画像スキャンからのAI一括登録（未実装機能のチケット化） |

## 更新ファイル

- `AGENTS.md` — 入口のみ（最優先ルール・概要・正本・verify・詳細リンク）を残し、詳細は参照リンク化
- `.agents/index.md` — 新規ファイル（`tech-stack.md`, `coding-standards.md`, `schema.md`）への参照を追加

## verify結果

VERIFY_PASSED

## 残タスク

- TKT-0001 の verify artifact / 完了報告（compact-inventory-list の手続き未完了）
- TKT-0002 / TKT-0003 は `spec_ready` 待ち（実装未着手）
