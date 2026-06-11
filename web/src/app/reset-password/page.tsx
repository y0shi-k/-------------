import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // recovery メールのリンク（/auth/confirm）経由でセッションが確立している前提。
  // セッションが無い（直接アクセス・期限切れ）場合は再送付からやり直してもらう。
  if (!user) {
    redirect("/login?error=reset_session_missing");
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="reset-password-title">
        <p className="eyebrow">Stock Master</p>
        <h1 id="reset-password-title">新しいパスワードの設定</h1>
        <p className="lead">8文字以上で、英字と数字を含む新しいパスワードを入力してください。</p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
