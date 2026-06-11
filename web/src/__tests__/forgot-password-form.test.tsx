import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

const resetPasswordForEmail = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      resetPasswordForEmail
    }
  })
}));

function submitEmail(email: string) {
  fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "再設定メールを送る" }));
}

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    resetPasswordForEmail.mockReset();
  });

  it("calls resetPasswordForEmail with a redirectTo pointing at /auth/confirm?next=/reset-password", async () => {
    resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    render(<ForgotPasswordForm />);
    submitEmail("user@example.com");

    await waitFor(() => {
      expect(resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`
      });
    });
  });

  it("shows the same confirmation on success", async () => {
    resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    render(<ForgotPasswordForm />);
    submitEmail("user@example.com");

    expect((await screen.findByRole("status")).textContent).toContain("メールを送信しました");
  });

  it("shows the identical confirmation when the address does not exist (no enumeration)", async () => {
    resetPasswordForEmail.mockResolvedValueOnce({
      error: { message: "User not found" }
    });
    render(<ForgotPasswordForm />);
    submitEmail("missing@example.com");

    expect((await screen.findByRole("status")).textContent).toContain("メールを送信しました");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a distinct rate-limit error", async () => {
    resetPasswordForEmail.mockResolvedValueOnce({
      error: { message: "Email rate limit exceeded" }
    });
    render(<ForgotPasswordForm />);
    submitEmail("user@example.com");

    expect((await screen.findByRole("alert")).textContent).toContain("リクエストが多すぎます");
    expect(screen.queryByRole("status")).toBeNull();
  });
});
