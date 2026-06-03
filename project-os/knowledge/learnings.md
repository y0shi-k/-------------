# Learnings（学び・失敗パターン）

> 踏んだ地雷と再発防止策を蓄積する。decisions.md（何を決めたか）とは別に、
> 「何で失敗し、次どう防ぐか」を1件1ブロックで残す。新しい学びを上に積む。

---

## 2026-06-03 直接修正依頼で /new-ticket を飛ばして実装してしまった（TKT-0155）

### 事象
ユーザーの「この画面を直して」という直接依頼に対し、プラン承認後そのまま実装→verifyを進め、
本来先行すべき `/new-ticket`（着手前のチケット起票）を飛ばした。チケット・spec・report が後追いになった。

### 原因
`check_gates.py` は「最後に artifact が揃っているか」だけを見て、「実装前にチケットがあったか」の順序は
強制しない。規約（CLAUDE.md/AGENTS.md の `/new-ticket → /implement → /verify → /finalize`）はあるが
機械ゲートが無いため、直接依頼だと順序を省略しやすい。

### 再発防止
非trivialなWeb版変更は、直接修正依頼でも**実装前に `/new-ticket` を起票**し、spec/required_evals を先に決める。
完了時は `/finalize` で report.md まで揃える。順序強制が欲しい場合は、`web/` への Edit 時に対応する
in-progress チケットが無ければ警告する PreToolUse hook の導入を検討（未実装）。

---

## 2026-05-29 verify の秘密チェックがテストのモック秘密を誤検出した

### 事象
`verify_web.sh` の秘密直書きチェックが、`web/src/__tests__/` 内の `process.env.GEMINI_API_KEY = "..."` や
テスト用モック値を「秘密の直書き」と誤検出して fail にした。

### 原因
grep パターンがテストファイルと `process.env.X` 代入を除外していなかった。

### 再発防止
秘密スキャンは `__tests__` / `*.test.*` / `*.spec.*` を除外し、`process.env.` 行を除外する。
新しい policy チェックを足すときは、必ず「正常コードでの誤検出」と「実際の違反の検出」の両方をテストする。

---

## 2026-05-29 change_eval の paths_any が広すぎて全Web evalが発火しかけた

### 事象
`match_rules` を「paths_any OR diff_regex_any」で実装したら、`web/` を触るだけで全Web evalが一致し、
軽量化の意味が消えた。

### 原因
`paths_any: ["web/"]` が粗く、内容シグナル（diff_regex_any）と AND で評価すべきだった。

### 再発防止
eval マッチは「対象パス AND 内容regex」（両方定義時）。`check_gates.py` の `match_evals` がこの意味論。

---

## 2026-06-04 レイアウトのみの変更が写真/テーブル名語彙で🔴evalに過剰マッチ（再発）

### 事象
TKT-0160（料理・記録のPC多カラム化、CSS+state同期のみ）で `/check-gates` が `photo_upload_storage` と `supabase_schema_change` の🔴危険evalに一致。実際は Supabase schema/migration/RLS/Storage アップロード処理に無変更。TKT-0166 でも同種が発生済み。

### 原因
`change_evals.json` の `paths_any:["web/"]` に対する `diff_regex_any`（`photo|image|写真`、`recipes|cooking_history|photos`）が、既存の写真表示コード・コメントや**テストfixture/モックの語彙**（`usage_type:"cooking_history"`、`bucket_id:"photos"`、モック `recipes:"recipes"`）に当たる。内容regexが「危険なロジック」ではなく「ドメイン語の出現」を拾うため。

### 再発防止
- レイアウト/表示のみの変更で🔴evalが点いたら、止めずに manual-smokes.md（execution_mode: static_only）+ review.md で「写真Storage/schemaに実変更なし」を静的に立証し、誤検知である旨を明記して閉じる（ticket の required_gates に manual_smokes_done/review_ready を追加）。チケット作成時に owner_notes へ過剰マッチの可能性を先に書いておくと判断が速い。
- 将来 `diff_regex_any` を `__tests__`/`*.test.*` 除外やコメント除外まで精密化するかは保留（誤検知側に倒すのは安全寄りで許容）。
