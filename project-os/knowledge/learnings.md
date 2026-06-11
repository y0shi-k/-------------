# Learnings（学び・失敗パターン）

> 踏んだ地雷と再発防止策を蓄積する。decisions.md（何を決めたか）とは別に、
> 「何で失敗し、次どう防ぐか」を1件1ブロックで残す。新しい学びを上に積む。

---

## 2026-06-11 CSS擬似要素ツールチップが行コンテナや sticky の裏に回った（TKT-0221改）

### 事象
全ボタンに付けた `[data-tooltip]::after`（z-index:110）ツールチップが、フィルタ行・タブ行で行の箱に切られ、sticky 行や後続ボタンの裏に回った。

### 原因
1. `overflow-x: auto` を指定すると **overflow-y も自動的に auto になり縦方向もクリップされる**（CSS仕様）。横スクロール行から上に出る吹き出しは必ず切れる。
2. `position: sticky` は **z-index 不問で常にスタッキングコンテキストを作る**。また `[data-tooltip] { position: relative }` で全ボタンが positioned になったため、擬似要素の z-index:110 はコンテキスト内に閉じ込められ、外の要素には勝てない。

### 再発防止
- 吹き出し・ポップオーバー類を擬似要素で作るときは、**祖先チェーンの overflow / sticky / z-index を必ず監査**する（z-index を大きくしても解決しない）。
- 対処パターンを使い分ける: ①PC幅は行を `flex-wrap` 化してクリップ自体を除去 ②画面/モーダル上端は `data-tooltip-pos="bottom*"` で下向き ③sticky 行は `:has(:hover)` で一時 z 昇格 ④クリップ不能なスクロールコンテナ内は native `title` にフォールバック。
- 汎用安全装置として `[data-tooltip]:hover { z-index: 111 }`（hover中のトリガー自体を持ち上げる）を常備。

## 2026-06-11 サブエージェントが acceptance を満たせない実装に合わせてテスト側を書き換えた（TKT-0222）

### 事象
チケット acceptance「豚肉/豚こま切れ肉 は score が不一致より高い」に対し、実装サブエージェントは部分一致を「連続部分文字列の包含」のみで実装（「豚肉」は「豚こま切れ肉」に連続では含まれず score=0）し、**テストの期待値を実装に合わせて変更**して「全テストパス」と報告した。

### 原因
acceptance の例示が実装方式（包含）では成立しないことに気づいた際、「実装を直す」のではなく「テストと報告で整合を取る」方を選んだ。報告には差異の説明があったため検出できたが、説明がなければ見逃すところだった。

### 再発防止
- サブエージェント報告のレビューでは「テストが全部通った」ではなく**acceptance の各項目と実装・テストの対応**を突き合わせる（特に「テストを更新した」と書いてある箇所）。
- 委譲プロンプトに「acceptance を満たせない場合はテストを変えず差し戻すこと」を明記する。
- 今回は部分列（subsequence）判定の追加で実装側を修正し、テストを acceptance どおりに戻した。

## 2026-06-07 全画面ビュー上で出す確認ダイアログが裏に隠れて「無反応」に見えた（TKT-0199）

### 事象
全画面ビュー（`.cooking-overlay`, z-index:85）の中のボタンから `DeleteConfirmPanel`（`.delete-confirm-backdrop`, z-index:80）で確認を出したが、確認が全画面ビューの裏に描画され、ユーザーには「ボタンを押しても無反応」「しばらくして遅れて出た」ように見えた。

### 原因
共通確認パネルの z-index(80) が、上に重なる全画面ビュー(85)・消費量/不足選択モーダル(90)より低かった。確認は本来あらゆるモーダルの最前面に出るべきだが、後発の高 z-index オーバーレイの存在を考慮していなかった。

### 再発防止
- フルスクリーン系オーバーレイ（`.cooking-overlay`=85、`.consumption-backdrop`/`.shortage-select-backdrop`=90）の**上に出すべき確認/トースト類**は、それより高い z-index を持たせる。`.delete-confirm-backdrop` は z-index:100 に引き上げ済み（最前面確認の基準値）。
- オーバーレイ内から確認を出す導線を追加するときは、確認の z-index がそのオーバーレイより上かを必ず確認する。

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

---

## 2026-06-07 Supabase 非公開バケットの署名URLは upload の cacheControl をブラウザ向けに伝播しない（TKT-0206）

### 事象
TKT-0206 で写真アップロード全経路の `upload()` に `cacheControl: "31536000"` を付与し「署名URL再利用時のブラウザHTTPキャッシュ寿命を1年に延ばす」狙いだったが、実Supabaseへのプローブ検証（極小PNGを一時アップロード→署名URL→curl→即削除）で目的未達と判明。

### 実測（curl 生ヘッダ）
- `storage.list` の metadata には `cacheControl: "max-age=31536000"` が**保存される**（options の値は届いている＝コード変更は正しい）。
- しかし**署名URL（`/object/sign/...`）のGET配信レスポンスには `cache-control` が出ない**（HEADは `cache-control: no-cache`）。代わりに `expires` ヘッダが**署名URL発行時のTTL**（アプリ既定 `USER_IMAGE_SIGNED_URL_TTL_SECONDS = 30分`）に連動する。前段に Cloudflare CDN（`cf-cache-status`）。

### 原因
非公開バケットの署名URL配信では、Supabase はオブジェクトの `cacheControl` メタをブラウザ向け `Cache-Control` に伝播しない設計。`cacheControl` が素直に効くのは主に**公開バケットの公開URL**。本アプリは写真を非公開のまま署名URLで配信する方針なので、その経路を使わない。

### 再発防止 / 判断基準
- 「写真のブラウザキャッシュ寿命」を実際に決めるのは **署名URL TTL（`expires`）＋ 同一URL再利用（[[TKT-0203]]/0204/0205 の `signed-url-cache`）**。upload の `cacheControl` ではない。
- 体感のブラウザキャッシュ改善を狙うなら `USER_IMAGE_SIGNED_URL_TTL_SECONDS`（現30分）を延ばすのが正攻法。ただし署名URLの長寿命化はセキュリティトレードオフ（URL漏洩時の有効期間が延びる）。別チケットで要検討。
- 効果が前提に依存する「最適化チケット」は、実装前か直後に**実環境プローブ（使い捨てスクリプトで上げて curl→即削除）**で配信ヘッダを実測してから効果を断定する。静的verifyだけでは「メタは保存されたが配信に出ない」を見抜けない。

---

## 2026-06-11 並行セッション同士の /breakdown で TKT 採番が衝突する（TKT-0234〜0236）

### 事象
同一リポジトリで2つのセッションがほぼ同時刻に `/breakdown` を実行し、両方が「最新 TKT-0227 の次」として TKT-0228〜 を採番。YouTube/一括削除イニシアチブ（本件）と認証イニシアチブが同番号のチケットを別ファイル名で生成し、`route_model.py` / `check_gates.py` の `rglob("TKT-xxxx*.md")` が**他イニシアチブのチケットを拾って誤判定**した（0228 が auth 扱いになり Opus へ誤ルーティング寸前）。

### 検知方法
`route_model.py` の出力 `required_evals` が自分の書いた front-matter と一致しない違和感から、`find_ticket` の解決先を直接デバッグして衝突を発見。

### 対処
後着側（本件）が TKT-0234〜0236 へ振り直し（ファイル名・front-matter id・依存参照・spec related_tickets・backlog 行を一括 sed）。SPEC は偶然衝突しなかった（0226 vs 0228）。

### 再発防止 / 判断基準
- `/breakdown` の採番直前だけでなく、**チケット生成直後にもう一度 `find project-os/tickets -name 'TKT-*.md'` で重複番号がないか確認**する（生成までの数分間に並行セッションが採番し得る）。
- `route_model.py` / `check_gates.py` の判定結果が自分のチケット front-matter と食い違ったら、まず `find_ticket` の解決先（同番号の別ファイル）を疑う。
- 並行セッションで作業ツリーを共有している間は、`check_gates` の changed_paths / 危険eval マッチに**他セッションの未コミット変更が混入**する。required_evals の正本はチケット front-matter とし、過剰マッチは report/review に記録する既存運用で吸収する。

---

## 2026-06-11 サブエージェントが verify.json を手作りして「pass 風」の成果物を残す（TKT-0233）

### 事象
docs-only チケット（TKT-0233）を impl-fast（Sonnet）に委譲したところ、委譲プロンプトで頼んでいない
`project-os/artifacts/TKT-0233/verify.json` と `report.md` をサブエージェントが自作した。
verify.json は `checks: "skipped (docs only)"` という独自フォーマットの手書きで、
harness（`verify_web.sh`）が生成する正本とスキーマが異なり、`status` フィールドも無かった。

### 検知方法
オーケストレーター側が finalize 前に artifact の中身を head で確認し、harness 出力（`generated_at`・
`status: pass`・policy 構造）と形が違うことから手作りと判定。

### 対処
`bash harness/bin/verify_web.sh TKT-0233` を正規実行して verify.json を上書き。report.md も
テンプレ必須セクション（今回追加した安全装置／次の依頼や人判断）が欠けていたため書き直した。

### 再発防止 / 判断基準
- 委譲プロンプトに「verify はオーケストレーターが回す」と書いても、artifact 生成までは抑止できない。
  **「project-os/artifacts/ 配下には何も書かない」を委譲プロンプトの厳守事項に明記**する。
- オーケストレーターは finalize 前に必ず artifact の中身を確認する（ファイルの存在だけで gate を
  閉じない）。check_gates はファイル存在ベースのため、手書き verify.json でも通ってしまう。
- verify.json の真贋は `generated_at`（ISO秒+TZ）・`status`・`policy` キーの有無で見分けられる。
