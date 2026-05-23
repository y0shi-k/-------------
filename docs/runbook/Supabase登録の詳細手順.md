# Supabase登録の詳細手順

## 結論

Supabase登録は、TKT-0102の実装が終わった後、TKT-0103でDBテーブルを作る前に行うのが最適です。

この手順では、Supabaseアカウントを作り、Stock Master Web版で使うプロジェクトを作成し、ローカル開発用の `web/.env.local` に必要な値を入れるところまで説明します。

## この手順でやること

- Supabaseアカウントを作る
- Supabaseプロジェクトを作る
- Web版に必要なURLとキーを確認する
- `web/.env.local` に実値を入れる
- 秘密鍵をチャット、Git、Markdownに貼らない運用を確認する

## この手順でまだやらないこと

- DBテーブル作成
- RLS作成
- ログイン画面実装
- 写真Storage設定
- Vercel本番公開
- 既存Spreadsheetデータの移行

これらは後続チケットで順番に進めます。

## 事前に知っておくこと

Supabaseは、Webアプリ用のデータ保存、ログイン、写真保存をまとめて扱えるサービスです。

Stock Master Web版では、Canvas版で使っていたGoogle SpreadsheetやGoogle Driveの代わりにSupabaseを使います。

重要なキーは次の3種類です。

| 名前 | 用途 | 扱い |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabaseプロジェクトの住所 | ブラウザに見えてよい |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ブラウザから接続する公開用キー | ブラウザに見えてよい |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバーだけで使う強い秘密鍵 | 絶対に公開しない |

`SUPABASE_SERVICE_ROLE_KEY` は特に危険です。漏れると、データの読み書きや削除につながる可能性があります。

## 1. Supabaseに登録する

1. ブラウザで `https://supabase.com/` を開きます。
2. `Start your project` または `Sign in` を押します。
3. GitHubアカウント、メールアドレスなど、使いやすい方法で登録します。
4. ログイン後、Supabaseのダッシュボードが表示されることを確認します。

料金プランは変更される可能性があります。登録前に公式のPricingページで無料枠と制限を確認してください。

## 2. Organizationを確認する

Supabaseでは、プロジェクトはOrganizationの中に作られます。

個人開発なら、最初に作られる個人用Organizationで問題ありません。

Organization名は、あとで見分けやすい名前にしておくと管理しやすいです。

例:

```text
stock-master-personal
```

## 3. 新しいProjectを作る

1. Supabaseダッシュボードで `New project` を押します。
2. Organizationを選びます。
3. Project nameを入力します。

例:

```text
stock-master-web
```

4. Database Passwordを設定します。
5. Regionを選びます。
6. `Create new project` を押します。

Regionは、日本から使うならTokyoが選べる場合はTokyo、なければ近い地域を選びます。

Database Passwordは秘密情報です。チャットやドキュメントに貼らないでください。

## 4. Project URLとanon keyを確認する

プロジェクト作成後、ダッシュボードで次を開きます。

```text
Project Settings
→ API
```

そこで以下を確認します。

- Project URL
- anon public key

それぞれ、ローカル開発では次の環境変数に入れます。

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`NEXT_PUBLIC_` が付いているものは、ブラウザ側に見える前提の値です。

## 5. service role keyを確認する

同じAPI設定画面で、`service_role` keyを確認できます。

これはサーバー側だけで使う強い鍵です。

ローカル開発では次の環境変数に入れます。

```env
SUPABASE_SERVICE_ROLE_KEY=
```

注意:

- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` という名前にしない
- Gitにコミットしない
- チャットに貼らない
- Markdownに貼らない
- 画面共有やスクリーンショットにも注意する

## 6. `web/.env.local` を作る

リポジトリの `web/` フォルダに、`.env.local` というファイルを作ります。

`web/.env.example` を見本にして、次のように入れます。

```env
NEXT_PUBLIC_SUPABASE_URL=ここにProject URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=ここにanon public key
SUPABASE_SERVICE_ROLE_KEY=ここにservice_role key
SUPABASE_DB_PASSWORD=ここにDatabase Password
GEMINI_API_KEY=ここにGemini API key
```

`web/.env.local` はGit管理外です。共有用の見本は `web/.env.example` だけです。

## 7. ローカルで接続確認する

TKT-0102の実装後、次のコマンドでWeb版の基本確認を行います。

```bash
cd web
npm run lint
npm run typecheck
npm run test
npm run build
```

この時点では、まだDBテーブルを作っていないため、食材データの保存確認までは行いません。

## 8. Vercel公開時に必要なこと

Vercelに公開する段階では、VercelのProject Settingsにも同じ環境変数を設定します。

ただし、Vercel公開はTKT-0112付近で扱います。TKT-0102の段階ではまだ実施しません。

## よくある間違い

### `service_role` keyをブラウザ用に入れてしまう

原因:

`NEXT_PUBLIC_` が付くとブラウザへ見える、というNext.jsのルールを忘れている。

影響:

秘密鍵が外部に見える危険があります。

修正方法:

`SUPABASE_SERVICE_ROLE_KEY` のままにし、`NEXT_PUBLIC_` を付けないでください。

### `.env.local` をGitに入れてしまう

原因:

秘密情報入りのファイルを通常のコードと同じように扱ってしまう。

影響:

APIキーやDBパスワードが漏れる可能性があります。

修正方法:

`.env.local` はGit管理外にします。このリポジトリでは `web/.gitignore` で除外します。

### DBテーブルを先に手作業で作ってしまう

原因:

Supabase画面上で先に作った方が早そうに見える。

影響:

リポジトリ側の正本とSupabase本番側がずれて、あとで再現しにくくなります。

修正方法:

DBテーブルはTKT-0103で、migrationとしてリポジトリに残す形で作ります。

## 次のチケット

Supabaseプロジェクト作成と `.env.local` 設定が終わったら、次は `TKT-0103-supabase-schema-v1` でDBテーブル設計へ進みます。
