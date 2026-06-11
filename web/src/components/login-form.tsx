"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function getLoginErrorMessage(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが違います。";
  }

  return "ログインできませんでした。入力内容を確認してください。";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(getLoginErrorMessage(error.message));
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        <span>メールアドレス</span>
        <input
          autoComplete="email"
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label>
        <span>パスワード</span>
        <input
          autoComplete="current-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {errorMessage ? (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button className="primary-button" disabled={isSubmitting} type="submit" data-tooltip="メールアドレスとパスワードでログイン">
        {isSubmitting ? "ログイン中" : "ログイン"}
      </button>
      <p className="auth-links">
        <Link href="/forgot-password">パスワードを忘れた方</Link>
      </p>
      <p className="auth-links">
        アカウントをお持ちでない方は <Link href="/signup">新規登録</Link>
      </p>
    </form>
  );
}
