# Learnings（学び・失敗パターン）

> 踏んだ地雷と再発防止策を蓄積する。decisions.md（何を決めたか）とは別に、
> 「何で失敗し、次どう防ぐか」を1件1ブロックで残す。新しい学びを上に積む。

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
