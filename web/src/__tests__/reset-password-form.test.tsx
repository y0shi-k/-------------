import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordForm } from "@/components/reset-password-form";

const updateUser = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh })
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      updateUser
    }
  })
}));

function fillForm(password: string, confirm: string) {
  fireEvent.change(screen.getByLabelText("新しいパスワード"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("新しいパスワード（確認）"), { target: { value: confirm } });
}

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    updateUser.mockReset();
    refresh.mockReset();
  });

  it("shows a Japanese error when passwords do not match and does not call updateUser", async () => {
    render(<ResetPasswordForm />);
    fillForm("password123", "password999");
    fireEvent.click(screen.getByRole("button", { name: "パスワードを変更する" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "パスワードが一致しません。もう一度入力してください。"
    );
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("calls updateUser with the new password and shows the success state", async () => {
    updateUser.mockResolvedValueOnce({ error: null });
    render(<ResetPasswordForm />);
    fillForm("password123", "password123");
    fireEvent.click(screen.getByRole("button", { name: "パスワードを変更する" }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith({ password: "password123" });
    });

    expect((await screen.findByRole("status")).textContent).toContain("パスワードを変更しました");
  });

  it("translates a weak-password error to safe Japanese", async () => {
    updateUser.mockResolvedValueOnce({
      error: { message: "Password should be at least 8 characters" }
    });
    render(<ResetPasswordForm />);
    fillForm("short1", "short1");
    fireEvent.click(screen.getByRole("button", { name: "パスワードを変更する" }));

    expect((await screen.findByRole("alert")).textContent).toContain("条件を満たしていません");
  });

  it("translates a session-expired error to safe Japanese", async () => {
    updateUser.mockResolvedValueOnce({
      error: { message: "Auth session missing or expired" }
    });
    render(<ResetPasswordForm />);
    fillForm("password123", "password123");
    fireEvent.click(screen.getByRole("button", { name: "パスワードを変更する" }));

    expect((await screen.findByRole("alert")).textContent).toContain("有効期限");
  });
});
