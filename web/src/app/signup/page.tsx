import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="signup-title">
        <p className="eyebrow">Stock Master</p>
        <h1 id="signup-title">新規登録</h1>
        <p className="lead">
          メールアドレスとパスワードで登録を申請します。メール確認後、管理者の承認をお待ちください。
        </p>
        <SignupForm />
      </section>
    </main>
  );
}
