import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecipeThumb } from "@/components/ui/recipe-thumb";

describe("RecipeThumb", () => {
  it("renders an image when the recipe has a known demo photo", () => {
    render(<RecipeThumb recipe={{ name: "肉じゃが" }} />);
    const image = screen.getByRole("img", { name: "肉じゃが" });
    expect(image.tagName).toBe("IMG");
    expect(image.getAttribute("src")).toBe("/images/recipes/recipe-nikujaga.webp");
  });

  it("falls back to a placeholder when no demo photo matches", () => {
    render(<RecipeThumb recipe={{ name: "謎の創作料理" }} />);
    const placeholder = screen.getByRole("img", { name: "謎の創作料理" });
    expect(placeholder.tagName).toBe("DIV");
    expect(placeholder.className).toContain("recipe-thumb--placeholder");
    // 頭文字をプレースホルダに出す
    expect(placeholder.textContent).toBe("謎");
  });

  it("ユーザー登録画像（署名付きURL）を固定デモ画像より優先する", () => {
    // 肉じゃがはデモ画像があるが、imageUrl があればそちらを優先する。
    render(<RecipeThumb imageUrl="https://signed/user.webp" recipe={{ name: "肉じゃが" }} />);
    const image = screen.getByRole("img", { name: "肉じゃが" });
    expect(image.getAttribute("src")).toBe("https://signed/user.webp");
  });

  it("ユーザー画像なしでもデモ画像があればデモ画像を出す", () => {
    render(<RecipeThumb imageUrl={null} recipe={{ name: "肉じゃが" }} />);
    expect(screen.getByRole("img", { name: "肉じゃが" }).getAttribute("src")).toBe("/images/recipes/recipe-nikujaga.webp");
  });

  it("ユーザー画像の読込に失敗したらデモ画像へフォールバックする", () => {
    render(<RecipeThumb imageUrl="https://signed/broken.webp" recipe={{ name: "肉じゃが" }} />);
    const image = screen.getByRole("img", { name: "肉じゃが" });
    fireEvent.error(image);
    expect(screen.getByRole("img", { name: "肉じゃが" }).getAttribute("src")).toBe("/images/recipes/recipe-nikujaga.webp");
  });

  it("ユーザー画像もデモ画像も使えない場合はプレースホルダへフォールバックする", () => {
    render(<RecipeThumb imageUrl="https://signed/broken.webp" recipe={{ name: "謎の創作料理" }} />);
    fireEvent.error(screen.getByRole("img", { name: "謎の創作料理" }));
    const placeholder = screen.getByRole("img", { name: "謎の創作料理" });
    expect(placeholder.tagName).toBe("DIV");
    expect(placeholder.className).toContain("recipe-thumb--placeholder");
  });
});
