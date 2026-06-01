# TKT-0147 完了報告

## 変更目的

料理・記録の履歴カードにあった反応しない操作を整理し、ユーザーが迷わず既存レシピの全画面調理ビューアへ移動できるようにした。

## これまで不足していた点

- 「写真を開く」「もう一度作る」「レシピを見る」が表示されていたが、実際の操作につながっていなかった。
- 画面下部に手動の「料理履歴を追加」フォームが残っており、今回の運用方針である「献立の料理完了フローから履歴を作る」と重複していた。

## 今回の変更

- `web/src/components/web-mode-shell.tsx`
  - 料理履歴から献立・レシピ画面へ移動するための `requestViewRecipe` / `pendingRecipeId` / `clearPendingRecipe` を追加。
  - 調理ビューアをどこから開いたかを `pendingRecipeOrigin` で記録し、閉じた後に元のモードへ戻せるようにした。
- `web/src/components/cooking-history-board.tsx`
  - 手動追加フォームと写真アップロード用の未使用コードを削除。
  - 履歴カードの操作を `recipe_id` がある場合の「レシピを見る」1つに整理。
  - `recipe_id` がない履歴では操作行を表示しない。
- `web/src/components/recipe-meal-workspace.tsx`
  - `pendingRecipeId` を受け取り、既存の `CookingViewer` を全画面で開く処理を追加。
  - 指すレシピが見つからない場合は「レシピが見つかりません」と通知。
  - 料理・記録から開いた調理ビューアは、左上の「戻る」で料理・記録へ戻るようにした。献立・レシピ画面から開いた場合は従来通り献立・レシピ画面へ戻る。
- `web/src/app/page.tsx`
  - 手動追加フォーム削除により不要になった `userId` prop を削除。
- `web/src/app/globals.css`
  - 削除したUIに紐づく不要スタイルを整理。
- `web/src/__tests__/cooking-history-board.test.tsx`
  - フォーム保存前提のテストを削除し、新仕様の表示・操作テストへ更新。
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - 料理・記録から開いた調理ビューアの戻り先が料理・記録になることを追加検証。

## 安全装置

- 新しい保存処理、Storageアップロード処理、RLS、API route、環境変数は追加・変更していない。
- APIキーやSupabase秘密鍵の直書きはしていない。
- 既存の全画面調理ビューアを再利用し、新しい調理UIは作っていない。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0147`
  - lint: pass
  - typecheck: pass
  - test: pass
  - build: pass
  - no_gas_dependency: pass
  - no_hardcoded_secret: pass
  - supabase_rls_present: pass
- ローカル起動確認
  - `npm run dev` で `http://localhost:3002` が起動することを確認。
  - 未ログイン状態では `/login` にリダイレクトされることを確認。

詳細は `project-os/artifacts/TKT-0147/verify.json` を参照。

## 残リスク

- ログイン後の実データ画面でのクリック確認は未実施。必要なら開発サーバーで、料理履歴カードの「レシピを見る」押下後に献立・レシピへ切り替わり、全画面調理ビューアが開くことを目視確認する。
- 手動で履歴を追加するUIは仕様通り削除済み。今後の履歴追加は献立の「料理を完了する」フローが前提。
