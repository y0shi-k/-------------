"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setErrorMessage("");
    setIsSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signOut();

    setIsSubmitting(false);

    if (error) {
      setErrorMessage("ログアウトできませんでした。時間をおいて再度お試しください。");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="account-actions">
      {errorMessage ? (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button className="secondary-button" disabled={isSubmitting} onClick={handleLogout} type="button" data-tooltip="アカウントからログアウト">
        {isSubmitting ? "ログアウト中" : "ログアウト"}
      </button>
    </div>
  );
}
