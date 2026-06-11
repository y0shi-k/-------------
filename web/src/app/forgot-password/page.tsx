import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ForgotPasswordPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="forgot-password-title">
        <p className="eyebrow">Stock Master</p>
        <h1 id="forgot-password-title">パスワードを忘れた方</h1>
        <p className="lead">
          登録済みのメールアドレスを入力してください。パスワード再設定用のリンクをメールでお送りします。
        </p>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
