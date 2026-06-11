"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function getResetPasswordErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("password") &&
    (normalized.includes("weak") || normalized.includes("least") || normalized.includes("short"))
  ) {
    return "パスワードが条件を満たしていません。8文字以上で、英字と数字を含めてください。";
  }

  if (normalized.includes("should be different") || normalized.includes("same as the existing") || normalized.includes("same_password")) {
    return "現在と異なるパスワードを設定してください。";
  }

  if (
    normalized.includes("session") ||
    normalized.includes("not authenticated") ||
    normalized.includes("expired") ||
    normalized.includes("jwt") ||
    normalized.includes("token")
  ) {
    return "再設定用のリンクの有効期限が切れています。お手数ですが、もう一度リセットメールを送信してください。";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "リクエストが多すぎます。しばらく待ってから再度お試しください。";
  }

  return "パスワードを変更できませんでした。入力内容を確認してください。";
}

export function ResetPasswordForm() {
  const router = useRouter();
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
    const { error } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(getResetPasswordErrorMessage(error.message));
      return;
    }

    setIsSubmitted(true);
    router.refresh();
  }

  if (isSubmitted) {
    return (
      <div className="auth-confirmation" role="status">
        <p className="form-success">パスワードを変更しました。</p>
        <p className="lead">新しいパスワードでアプリをご利用いただけます。</p>
        <p className="auth-links">
          <Link href="/">ホームへ進む</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/login">ログイン画面へ</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        <span>新しいパスワード</span>
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
        <span>新しいパスワード（確認）</span>
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
      <button className="primary-button" disabled={isSubmitting} type="submit" data-tooltip="新しいパスワードを設定">
        {isSubmitting ? "変更中" : "パスワードを変更する"}
      </button>
    </form>
  );
}
