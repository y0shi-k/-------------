import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="login-title">
        <p className="eyebrow">Stock Master</p>
        <h1 id="login-title">ログイン</h1>
        <p className="lead">登録済みのメールアドレスとパスワードで入ります。</p>
        <LoginForm />
      </section>
    </main>
  );
}
