import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/login-form";

const replace = vi.fn();
const refresh = vi.fn();
const signInWithPassword = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    refresh
  })
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signInWithPassword
    }
  })
}));

describe("LoginForm", () => {
  it("shows email, password, and submit controls", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("メールアドレス")).toBeTruthy();
    expect(screen.getByLabelText("パスワード")).toBeTruthy();
    expect(screen.getByRole("button", { name: "ログイン" })).toBeTruthy();
  });

  it("signs in with email and password", async () => {
    signInWithPassword.mockResolvedValueOnce({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("メールアドレス"), {
      target: { value: "user@example.com" }
    });
    fireEvent.change(screen.getByLabelText("パスワード"), {
      target: { value: "password123" }
    });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123"
      });
    });
    expect(replace).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows a safe Japanese error for invalid credentials", async () => {
    signInWithPassword.mockResolvedValueOnce({
      error: { message: "Invalid login credentials" }
    });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("メールアドレス"), {
      target: { value: "user@example.com" }
    });
    fireEvent.change(screen.getByLabelText("パスワード"), {
      target: { value: "wrong-password" }
    });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "メールアドレスまたはパスワードが違います。"
    );
  });
});
