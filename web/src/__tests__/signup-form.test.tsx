import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignupForm } from "@/components/signup-form";

const signUp = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signUp
    }
  })
}));

function fillForm(email: string, password: string, confirm: string) {
  fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("パスワード（確認）"), { target: { value: confirm } });
}

describe("SignupForm", () => {
  beforeEach(() => {
    signUp.mockReset();
  });

  it("renders email, password, confirm, and submit controls", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText("メールアドレス")).toBeTruthy();
    expect(screen.getByLabelText("パスワード")).toBeTruthy();
    expect(screen.getByLabelText("パスワード（確認）")).toBeTruthy();
    expect(screen.getByRole("button", { name: "登録申請する" })).toBeTruthy();
  });

  it("shows a Japanese error when passwords do not match", async () => {
    render(<SignupForm />);
    fillForm("user@example.com", "password123", "password999");
    fireEvent.click(screen.getByRole("button", { name: "登録申請する" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "パスワードが一致しません。もう一度入力してください。"
    );
    expect(signUp).not.toHaveBeenCalled();
  });

  it("calls signUp with an emailRedirectTo pointing at /auth/confirm and shows a confirmation", async () => {
    signUp.mockResolvedValueOnce({ error: null });
    render(<SignupForm />);
    fillForm("user@example.com", "password123", "password123");
    fireEvent.click(screen.getByRole("button", { name: "登録申請する" }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });
    });

    expect((await screen.findByRole("status")).textContent).toContain("確認メールを送信しました");
    expect(screen.getByText(/管理者の承認をお待ちください/)).toBeTruthy();
  });

  it("translates an already-registered error to safe Japanese", async () => {
    signUp.mockResolvedValueOnce({
      error: { message: "User already registered" }
    });
    render(<SignupForm />);
    fillForm("taken@example.com", "password123", "password123");
    fireEvent.click(screen.getByRole("button", { name: "登録申請する" }));

    expect((await screen.findByRole("alert")).textContent).toContain("登録済みの可能性");
  });

  it("translates a weak-password error to safe Japanese", async () => {
    signUp.mockResolvedValueOnce({
      error: { message: "Password should be at least 8 characters" }
    });
    render(<SignupForm />);
    fillForm("user@example.com", "short1", "short1");
    fireEvent.click(screen.getByRole("button", { name: "登録申請する" }));

    expect((await screen.findByRole("alert")).textContent).toContain("条件を満たしていません");
  });
});
