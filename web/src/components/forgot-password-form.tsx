"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

// メールアドレスの存在有無を露出しないため、成否に関わらず同一文言を表示する。
// レート制限のみ別文言を許容する（チケットの方針）。
function getForgotPasswordErrorMessage(message: string): string | null {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit") || normalized.includes("too many") || normalized.includes("for security purposes")) {
    return "リクエストが多すぎます。しばらく待ってから再度お試しください。";
  }

  // それ以外のエラー（未登録アドレス含む）は成功と同じ扱いにして存在有無を隠す。
  return null;
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`
    });

    setIsSubmitting(false);

    if (error) {
      const friendly = getForgotPasswordErrorMessage(error.message);
      if (friendly) {
        setErrorMessage(friendly);
        return;
      }
    }

    // 成功・未登録アドレスのいずれも同一の確認表示にする。
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="auth-confirmation" role="status">
        <p className="form-success">メールを送信しました。</p>
        <p className="lead">
          入力されたメールアドレスが登録済みの場合、パスワード再設定用のリンクを記載したメールをお送りします。
          メール内のリンクから新しいパスワードを設定してください。
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
      {errorMessage ? (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button
        className="primary-button"
        disabled={isSubmitting}
        type="submit"
        data-tooltip="登録済みメールアドレスに再設定リンクを送信"
      >
        {isSubmitting ? "送信中" : "再設定メールを送る"}
      </button>
      <p className="auth-links">
        <Link href="/login">ログイン画面へ戻る</Link>
      </p>
    </form>
  );
}
