---
name: implement
description: Web版チケットの実装を、危険度に応じてOpus(impl-deep)かHaiku(impl-fast)のサブエージェントに自動振り分けして実行し、実装後にverifyとgate判定を回す。実装フェーズの入口に使う。
---

# /implement — 危険度ルーティング付き実装

ticket の危険度に応じて実装モデルを振り分け、実装→検証まで一気通貫で行う。

## 手順
1. 引数から TKT を取得（無ければユーザーに確認）。`project-os/tickets/<TKT>` が無ければ先に `/new-ticket`。
2. **ルーティング判定**を実行する:
   ```bash
   python3 harness/bin/route_model.py <TKT-xxxx>
   ```
   出力末尾の `AGENT=impl-deep` または `AGENT=impl-fast` を読む。
   - `impl-deep` … 危険変更（auth/RLS・schema・写真Storage・AI route・移行）または required_evals 未設定 → Opus
   - `impl-fast` … 非危険変更（文言・CSS・軽量UI・PWA 等）→ Haiku
3. **判定されたサブエージェントに委譲**する（Agent ツール / `subagent_type` に `impl-deep` か `impl-fast` を指定）。
   **委譲前にオーケストレーター側で ticket と関連 spec を読み、再探索が不要な濃いプロンプトを作る**。
   委譲プロンプトに必ず含める:
   - 対象 TKT 番号と acceptance の要約（サブエージェントに ticket 全文の読み直しをさせない）
   - **編集対象のファイルパスと関連コードの場所**（オーケストレーターが既に把握している分は全部渡す。
     探索ゼロで実装に入れる状態が理想）
   - 「Canvas app.html は触らない、対象は web/ + supabase/」
   - 「実装後に `bash harness/bin/verify_web.sh <TKT>` を実行し、結果（pass/fail と policy 判定）を報告に含める。
     失敗したら原因を直してから報告する」
   - 「報告は触ったパスと要点・verify結果・残リスクのみ。コードや build ログ全文を貼らない」
4. エージェントの報告を受け取ったら、オーケストレーター側は **verify.json の存在と gate 判定の確認のみ**行う:
   ```
   /check-gates <TKT>
   ```
   （verify はサブエージェントが実行済み。報告と verify.json が食い違う場合のみ `/verify <TKT>` で再実行）
5. gate が閉じていれば `/finalize <TKT>` で完了処理。未閉なら不足を埋める。

## 補足
- 着手時に `status: in_progress` へ更新してよいが、これはファイル移動を伴わない（front-matter 編集のみ。`harness/bin/ticket_status.py <TKT> in_progress` でも可）。`tickets/completed/` への移動は `/finalize` の完了処理でのみ行う。
- 判定はハーネスの `change_evals.json` の `danger` フラグが正本。AIの勘で変えない。
- ユーザーが明示的にモデルを指定したら、その指示を優先してよい（例:「これは単純だから fast で」）。
- impl-fast が実装中に危険な兆候を見つけて差し戻してきたら、impl-deep に委譲し直す。
- 1チケット内に複雑・単純が混在する場合のみ本フローの価値が出る。チケット単位で複雑さが揃うなら、`/model` でのメイン切替の方が軽い。
