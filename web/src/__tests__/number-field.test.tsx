import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { NumberField } from "@/components/number-field";

afterEach(() => {
  window.localStorage.clear();
});

function Harness({ showSteppers = true, allowFraction = false }: { showSteppers?: boolean; allowFraction?: boolean }) {
  const [value, setValue] = useState("1");
  return (
    <div>
      <NumberField ariaLabel="数量" value={value} onChange={setValue} showSteppers={showSteppers} allowFraction={allowFraction} />
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

  it("allowFraction=false では端数ピッカーを描画しない", () => {
    render(<Harness />);
    expect(screen.queryByRole("button", { name: "分数を選ぶ" })).toBeNull();
  });

  it("allowFraction=true では端数ピッカーから選ぶと整数部に端数を足す", () => {
    render(<Harness allowFraction />);
    fireEvent.click(screen.getByRole("button", { name: "分数を選ぶ" }));
    fireEvent.click(screen.getByRole("button", { name: "1/2" }));
    expect(screen.getByTestId("value").textContent).toBe("1 1/2");
  });

  it("端数ピッカーで新しい分数を追加できる", () => {
    render(<Harness allowFraction />);
    fireEvent.click(screen.getByRole("button", { name: "分数を選ぶ" }));
    fireEvent.change(screen.getByLabelText("分数を検索・追加"), { target: { value: "3/8" } });
    fireEvent.click(screen.getByRole("button", { name: "「3/8」を追加" }));
    expect(screen.getByTestId("value").textContent).toBe("1 3/8");
  });

  it("allowFraction=true では帯分数入力を保持する", () => {
    render(<Harness allowFraction />);
    fireEvent.change(screen.getByLabelText("数量"), { target: { value: "2 1/2" } });
    expect(screen.getByTestId("value").textContent).toBe("2 1/2");
  });

  it("allowFraction=false ではスラッシュ・空白を除去する", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("数量"), { target: { value: "2 1/2" } });
    expect(screen.getByTestId("value").textContent).toBe("212");
  });
});
