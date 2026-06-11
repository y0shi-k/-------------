"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function getSignupErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already")
  ) {
    return "このメールアドレスは登録済みの可能性があります。ログインするか、別のメールアドレスをお試しください。";
  }

  if (normalized.includes("password") && (normalized.includes("weak") || normalized.includes("least") || normalized.includes("short"))) {
    return "パスワードが条件を満たしていません。8文字以上で、英字と数字を含めてください。";
  }

  if (normalized.includes("signups not allowed") || normalized.includes("signup is disabled")) {
    return "現在、新規登録を受け付けていません。管理者にお問い合わせください。";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "リクエストが多すぎます。しばらく待ってから再度お試しください。";
  }

  return "登録できませんでした。入力内容を確認してください。";
}

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password !== passwordConfirm) {
      setErrorMessage("パスワードが一致しません。もう一度入力してください。");
      return;
    }

    setIsSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`
      }
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(getSignupErrorMessage(error.message));
      return;
    }

    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="auth-confirmation" role="status">
        <p className="form-success">確認メールを送信しました。</p>
        <p className="lead">
          メール内のリンクをクリックしてメールアドレスの確認を完了してください。
          確認後、管理者の承認をお待ちください。承認されるとアプリをご利用いただけます。
        </p>
        <p className="auth-links">
          <Link href="/login">ログイン画面へ戻る</Link>
        </p>
      </div>
    );
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
          autoComplete="new-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <label>
        <span>パスワード（確認）</span>
        <input
          autoComplete="new-password"
          name="password-confirm"
          onChange={(event) => setPasswordConfirm(event.target.value)}
          required
          type="password"
          value={passwordConfirm}
        />
      </label>
      {errorMessage ? (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button
        className="primary-button"
        disabled={isSubmitting}
        type="submit"
        data-tooltip="メールアドレスとパスワードで登録申請"
      >
        {isSubmitting ? "送信中" : "登録申請する"}
      </button>
      <p className="auth-links">
        すでにアカウントをお持ちですか？ <Link href="/login">ログイン</Link>
      </p>
    </form>
  );
}
