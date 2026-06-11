---
ticket_id: TKT-0227-user-synonym-dictionary-settings
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

静的辞書（name-match.ts）に無い表記ゆれ（家庭ごとの呼び方・地方名）をユーザー自身が設定画面から登録でき、コード変更なしで消費量調整の自動紐付け・買い物不足計算に反映されるようにした。

- `web/src/lib/ingredients/name-match.ts`: `setUserSynonymGroups()` を追加。ユーザー辞書はモジュール変数 `userSynonymMap`（正規化済み語→`user:${idx}`。静的辞書の number ID と名前空間分離）で保持し、差し替えは常に新 Map 構築（イミュータブル）。matches/score の辞書照合に「静的 → ユーザー」の順で合成（ユーザー辞書一致も score=2）。
- `web/src/lib/ingredients/user-synonyms.ts`（新規）: parse（1行=1グループ、区切り「＝」「=」「、」「,」、trim・空語除去・2語未満無視）/ format / load / save / `applyUserSynonymGroupsFromStorage`。localStorage キー `stock-master:user-synonym-groups:v1`、`stock-card-background.ts` と同パターン（SSR-safe・try/catch・JSON 型検証）。
- `web/src/components/settings-panel.tsx`: 「食材名の同義語辞書」セクション（textarea・保存ボタン・有効グループ数フィードバック）。
- `web/src/components/web-mode-shell.tsx`: クライアントマウント時の `useEffect` で localStorage から読み込み適用。
- `web/src/app/globals.css`: セクション用の3クラス追加。

## 今回追加した安全装置

- 保存は localStorage 保存＋`setUserSynonymGroups` をセットで行い、保存した瞬間からマッチングに即時反映。空保存で静的辞書のみの挙動に戻る（解除）こともテストで固定。
- 静的辞書（SYNONYM_GROUPS）のコード・挙動は無変更。部分一致を同一視しない SPEC-0222 方針も不変（ユーザー辞書は「同一グループ登録」のみが同一視に効く）。
- 不正な localStorage 値（JSON 破損・型不一致）は型検証で弾いて空配列にフォールバック。
- テスト27件追加（parse 区切り4種・2語未満無視・往復、load/save、即時反映・解除、静的辞書不変、設定UIの表示/保存/フィードバック）。name-match のモジュール状態は `afterEach` でリセットしテスト間の漏れを防止。

## 実施した確認

- `/verify TKT-0227`: lint / typecheck / test（39ファイル・415件全パス）/ build すべて pass。policy も pass。`verify.json` 参照。

## 残リスク

- **端末ローカル**: localStorage 保存のため他端末と同期しない（チケットで確定した制約。DB同期は将来の別チケット）。
- 同一セッション中に別タブで保存した変更は、このタブには反映されない（リロードで反映）。
- 設定UIの見え方（textarea・フィードバック）は実機目視が未実施。

## 次の依頼や人判断

- なし。eval の過剰マッチは作業ツリー上の他チケット語彙由来で、本チケットは localStorage＋クライアントロジック＋設定UIのみ（manual-smokes.md / review.md に記録）。
