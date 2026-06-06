import { describe, expect, it } from "vitest";
import { extractImageFilesFromDataTransfer } from "@/lib/photos/use-image-file-drop";

function makeTransfer(types: string[], files: File[]) {
  return { files, types };
}

describe("extractImageFilesFromDataTransfer", () => {
  it("Files が含まれなければ空配列を返す", () => {
    const image = new File(["image"], "recipe.png", { type: "image/png" });

    expect(extractImageFilesFromDataTransfer(makeTransfer(["text/plain"], [image]))).toEqual([]);
  });

  it("非画像だけなら空配列を返す", () => {
    const text = new File(["text"], "memo.txt", { type: "text/plain" });
    const pdf = new File(["pdf"], "recipe.pdf", { type: "application/pdf" });

    expect(extractImageFilesFromDataTransfer(makeTransfer(["Files"], [text, pdf]))).toEqual([]);
  });

  it("画像1件を返す", () => {
    const image = new File(["image"], "recipe.jpg", { type: "image/jpeg" });

    expect(extractImageFilesFromDataTransfer(makeTransfer(["Files"], [image]))).toEqual([image]);
  });

  it("画像複数件を返す", () => {
    const first = new File(["first"], "first.webp", { type: "image/webp" });
    const second = new File(["second"], "second.png", { type: "image/png" });

    expect(extractImageFilesFromDataTransfer(makeTransfer(["Files"], [first, second]))).toEqual([first, second]);
  });

  it("画像と非画像が混在したら画像だけを返す", () => {
    const text = new File(["text"], "memo.txt", { type: "text/plain" });
    const image = new File(["image"], "recipe.png", { type: "image/png" });

    expect(extractImageFilesFromDataTransfer(makeTransfer(["Files"], [text, image]))).toEqual([image]);
  });

  it("クリップボード形状（ClipboardEvent.clipboardData 相当）の貼り付け画像を抽出する", () => {
    // Ctrl+V のスクリーンショット貼り付けは clipboardData.types=["Files"]・files に画像を持つ。
    const pasted = new File(["pasted"], "image.png", { type: "image/png" });

    expect(extractImageFilesFromDataTransfer(makeTransfer(["Files"], [pasted]))).toEqual([pasted]);
  });

  it("テキストのみの貼り付け（Files 無し）は空配列を返す", () => {
    const note = new File(["note"], "note.txt", { type: "text/plain" });

    expect(extractImageFilesFromDataTransfer(makeTransfer(["text/plain"], [note]))).toEqual([]);
  });
});
