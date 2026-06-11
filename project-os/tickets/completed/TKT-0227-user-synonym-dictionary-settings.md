---
id: TKT-0227-user-synonym-dictionary-settings
title: 食材名の同義語辞書を設定画面から登録できるようにする
status: completed
goal: 静的辞書（name-match.ts）に無い表記ゆれ（家庭ごとの呼び方）をユーザー自身が登録でき、コード変更なしで自動紐付け・不足計算に反映されるようにする。
acceptance:
  - "設定画面（`settings-panel.tsx`）に「食材名の同義語辞書」セクションが追加され、textarea で 1行=1グループ（区切りは「＝」「=」「、」「,」のいずれか）の形式で編集・保存できる（例: `かしわ＝鶏肉` / `万願寺とうがらし、万願寺` ）"
  - 保存内容は localStorage（キー `stock-master:user-synonym-groups:v1`）に永続化され、リロード後も復元される（既存設定 `stock-card-background.ts` と同パターン。SSR-safe・try/catch）
  - 保存と同時にマッチングへ即時反映され、`matchesIngredientName` がユーザー辞書の同一グループ語で true / `ingredientNameMatchScore` が 2（辞書一致）を返す
  - アプリ起動時（クライアントマウント時）に localStorage から読み込まれ、消費量調整の自動紐付け・買い物不足計算・候補並び順に効く
  - ユーザー辞書を空にすると静的辞書のみの挙動に戻る（登録解除が効く）
  - 2語未満の行・空白だけの語は無視され、保存時に有効グループ数がフィードバック表示される
  - 静的辞書（SYNONYM_GROUPS）の挙動・部分一致を同一視しない方針（SPEC-0222）は不変
  - 既存テストに加え、parse/保存/即時反映/解除のユニットテストが追加される
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/lib/ingredients/name-match.ts
  - web/src/lib/ingredients/user-synonyms.ts
  - web/src/components/settings-panel.tsx
  - web/src/components/web-mode-shell.tsx
  - web/src/__tests__/user-synonyms.test.ts
  - web/src/__tests__/settings-panel.test.tsx
  - project-os/artifacts/TKT-0227/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0222-ingredient-name-matching
related_artifacts:
  - artifacts/TKT-0227/verify.json
  - artifacts/TKT-0227/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0227`。コマンドの正本は `harness/registry.json`
  - 非危険変更（localStorage＋クライアントロジック＋設定UIのみ）。DB schema / Auth・RLS / Storage / AI route / CSV移行は触らない
  - localStorage 保存のため**端末ローカル**（他端末と同期しない）。DB同期は将来の別チケット（report に制約として明記する）
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

TKT-0222 の名前マッチングは静的辞書のみで、未収録の表記ゆれ（家庭ごとの呼び方・地方名）はコード変更でしか追加できない。設定画面からユーザー自身が同義グループを登録できるようにし、localStorage に保存して `name-match.ts` のマッチングに合成する。

## 設計（オーケストレーター承認済み）

1. **`web/src/lib/ingredients/name-match.ts` 拡張**
   - `setUserSynonymGroups(groups: readonly (readonly string[])[]): void` を export。モジュールレベルのユーザー辞書 Map（正規化済み語→`user:${idx}` 形式のグループID。静的辞書のグループIDと名前空間衝突しない）を**新しい Map を構築して差し替え**る（既存 Map の mutate はしない）。
   - `matchesIngredientName` / `ingredientNameMatchScore` の辞書一致判定で、静的 `SYNONYM_MAP` → ユーザー Map の順に照合（ユーザー辞書一致も score=2）。静的とユーザーにまたがる語は各 Map 内でのみ同一視（合成しない。シンプルさ優先）。
   - 純粋関数群にモジュール状態が入る例外であることをコメントで明記。
2. **`web/src/lib/ingredients/user-synonyms.ts` 新設**（localStorage IO。`stock-card-background.ts` のパターン踏襲）
   - `parseUserSynonymGroups(text: string): string[][]` … 1行=1グループ。区切り「＝」「=」「、」「,」。各語 trim・空語除去、2語未満の行は捨てる。
   - `formatUserSynonymGroups(groups: readonly (readonly string[])[]): string` … 逆変換（「＝」区切り・1行1グループ）。
   - `loadUserSynonymGroups(): string[][]` … SSR-safe（`typeof window` ガード）・try/catch・JSON.parse の型検証つき。
   - `saveUserSynonymGroups(groups): void` … localStorage 保存＋`setUserSynonymGroups` 呼び出しで**即時反映**。
   - `applyUserSynonymGroupsFromStorage(): void` … load→set（起動時初期化用）。
3. **起動時ロード**: `web-mode-shell.tsx` のクライアント `useEffect` で `applyUserSynonymGroupsFromStorage()` を1回呼ぶ（マッチングが走るのはモーダル操作時のため effect で間に合う）。
4. **設定UI**: `settings-panel.tsx` に「食材名の同義語辞書」セクション。textarea（rows 6 程度、placeholder に記入例）、「保存」ボタン（`data-tooltip` 付き・既存ボタン規約準拠）、保存後に「N グループを保存しました（無効な行は無視）」のフィードバック。初期値は `formatUserSynonymGroups(loadUserSynonymGroups())`。
5. **テスト**
   - `user-synonyms.test.ts`: parse（区切り4種・trim・2語未満無視・空行）、format 往復、load/save（localStorage モック）、save→`matchesIngredientName` 即時反映→空保存で解除。
   - `settings-panel.test.tsx`: セクション表示・入力→保存→localStorage に JSON が入る・フィードバック表示。

## 参照すべき既存実装

- `web/src/lib/ui/stock-card-background.ts` … localStorage 設定の前例（キー命名 `stock-master:*:v1`、isBrowser ガード、try/catch、console.error）。
- `web/src/components/settings-panel.tsx` … 設定セクションの既存マークアップ・保存フィードバックのパターン。
- `web/src/lib/ingredients/name-match.ts` … 静的辞書と SYNONYM_MAP 構築（87-95行）、matches/score の辞書照合箇所。

## 非ゴール

- DB（Supabase）保存・他端末同期（将来チケット）。
- 静的辞書（SYNONYM_GROUPS）の編集UI・表示。
- エクスポート/インポート、単位換算をまたぐ照合。

## 依存チケット

- TKT-0222（完了済み）。
