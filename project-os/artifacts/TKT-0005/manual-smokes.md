---
ticket_id: TKT-0005
status: passed
target_evals:
  - ui_component_addition
  - gas_pattern_change
---

# Manual Smoke Report — TKT-0005

## executed_checks

| Check ID | Result | Detail |
|---|---|---|
| html_syntax_check | PASS | `python3 -c "import html.parser..."` で構文エラーなし |
| gas_communication_pattern | PASS | `executeGAS()` と `setStatus()` が存在。個別GAS通信なし |
| manual_bulk_sync | PASS | AIレシピ保存は `queueRecipeCreate()` → `syncPendingChanges()` 経由 |
| ui_consistency | PASS | 新規モーダル・ボタンは既存Tailwindパターン（rounded-[2.5rem], shadow-2xl等）を踏襲 |
| canvas_notification | PASS | alert/confirm/prompt なし。showToast使用 |
| gemini_api_key_handling | PASS | `GEMINI_API_KEY = ""` のまま。空チェックなし |
| code_bloat_check | PASS | 既存のモーダル構造・Gemini呼び出しパターンを流用。無闇な肥大化なし |

## skipped_checks

| Check ID | Reason |
|---|---|
| schema_integrity | N/A — 本ticketはDBスキーマ変更なし（レシピ集シートはTKT-0004で作成済み） |

## open_risks

1. **Gemini API実際の通信テスト未実施** — `GEMINI_API_KEY` は空文字のまま。Canvas貼り付け後にユーザーがキーを設定して初めて実通信可能
2. **数量換算の限界** — プロンプトから数量表記を削除したが、AIが「1パック=10個」等の換算を自明に行う保証はない
3. **2段階APIのレイテンシ** — 相談+生成で2回APIコール。低速環境で体感速度が落ちる可能性
