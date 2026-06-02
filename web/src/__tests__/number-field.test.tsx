import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { NumberField } from "@/components/number-field";

function Harness({ showSteppers = true }: { showSteppers?: boolean }) {
  const [value, setValue] = useState("1");
  return (
    <div>
      <NumberField ariaLabel="数量" value={value} onChange={setValue} showSteppers={showSteppers} />
      <output data-testid="value">{value}</output>
    </div>
  );
}

describe("NumberField", () => {
  it("全角で入力されても半角に正規化される", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("数量"), { target: { value: "１０００" } });
    expect(screen.getByTestId("value").textContent).toBe("1000");
  });

  it("type=text + inputMode=decimal で描画される（IME混入を避ける）", () => {
    render(<Harness />);
    const input = screen.getByLabelText("数量");
    expect(input.getAttribute("type")).toBe("text");
    expect(input.getAttribute("inputmode")).toBe("decimal");
  });

  it("上矢印ボタンで1刻みに増える", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "1増やす" }));
    expect(screen.getByTestId("value").textContent).toBe("2");
  });

  it("キーボードの↑↓で1刻みに増減する", () => {
    render(<Harness />);
    const input = screen.getByLabelText("数量");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getByTestId("value").textContent).toBe("2");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByTestId("value").textContent).toBe("1");
  });

  it("showSteppers=false では矢印ボタンを描画しない", () => {
    render(<Harness showSteppers={false} />);
    expect(screen.queryByRole("button", { name: "1増やす" })).toBeNull();
  });
});
