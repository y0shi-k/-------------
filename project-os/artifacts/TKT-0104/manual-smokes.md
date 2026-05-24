# TKT-0104 Manual Smokes

Status: passed with limited live-login coverage

## Browser Checks

- Started the Next.js dev server at `http://localhost:3000`.
- Opened `/` while signed out and confirmed it redirected to `/login`.
- Confirmed `/login` shows:
  - `ログイン` heading
  - `メールアドレス` input
  - `パスワード` input
  - `ログイン` button
- Checked desktop viewport: no horizontal overflow, input height 48px, button height 46px.
- Checked mobile viewport at 390px width: no horizontal overflow, panel width 358px, input height 48px, button height 46px.
- Confirmed a real user can log in locally and reach the authenticated home screen.

## Not Covered Live

- Invalid-password live submission was not performed to avoid sending test credentials to the connected Supabase project. The safe Japanese error mapping is covered by unit test.

## Security Notes

- The browser client uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- The app page uses `supabase.auth.getUser()` before rendering user-specific content.
- Middleware also uses `getUser()` and redirects unauthenticated users before protected page rendering.
