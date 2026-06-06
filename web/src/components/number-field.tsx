"use client";

import type { KeyboardEvent } from "react";

import { FractionPicker } from "@/components/fraction-picker";
import {
  parseQuantityInput,
  sanitizeDecimalInput,
  sanitizeQuantityInput,
  stepDecimalString
} from "@/lib/format/numeric";

type NumberFieldProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  min?: number;
  step?: number;
  className?: string;
  id?: string;
  // 横幅の狭い行（レシピ材料など）では矢印ボタンを隠す。キーボード↑↓は常に有効。
  showSteppers?: boolean;
  // 分数・帯分数入力と端数ボタンを許可する（g/cc など重さ・体積の単位では false）。
  allowFraction?: boolean;
};

// 数量入力欄。type=text + inputMode=decimal にして全角→半角を正規化し、
// type=number で起きる日本語IME混入（全角数字が入る）を防ぐ。
// 上下矢印（1刻み）は独自のスピンボタンとキーボード↑↓で提供する。
// allowFraction=true のときは `1/2`・`2 1/2` の入力と端数ボタン（¼⅓½⅔¾）を許す。
export function NumberField({
  value,
  onChange,
  ariaLabel,
  placeholder,
  min = 0,
  step = 1,
  className,
  id,
  showSteppers = true,
  allowFraction = false
}: NumberFieldProps) {
  const sanitize = allowFraction ? sanitizeQuantityInput : sanitizeDecimalInput;

  const applyStep = (direction: 1 | -1) => {
    onChange(stepDecimalString(value, step, direction, min));
  };

  // 端数（分数）選択: 整数部はそのまま、端数だけ差し替える（足し算ではない）。
  // 分数ラベルから帯分数文字列を組み立て、3/8 のような端数も正確に保持する。
  const applyFractionLabel = (fractionLabel: string) => {
    const current = parseQuantityInput(value);
    const base = current.ok ? Math.floor(current.value) : 0;
    onChange(base > 0 ? `${base} ${fractionLabel}` : fractionLabel);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      applyStep(1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      applyStep(-1);
    }
  };

  return (
    <span className={className ? `number-field ${className}` : "number-field"}>
      <span className="number-field-row">
        <input
          id={id}
          className="number-field-input"
          type="text"
          inputMode={allowFraction ? "text" : "decimal"}
          autoComplete="off"
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(sanitize(event.target.value))}
          onKeyDown={handleKeyDown}
        />
        {showSteppers ? (
          <span className="number-field-steppers">
            <button type="button" tabIndex={-1} className="number-field-step" aria-label="1増やす" onClick={() => applyStep(1)}>
              <span aria-hidden="true">▲</span>
            </button>
            <button type="button" tabIndex={-1} className="number-field-step" aria-label="1減らす" onClick={() => applyStep(-1)}>
              <span aria-hidden="true">▼</span>
            </button>
          </span>
        ) : null}
      </span>
      {allowFraction ? (
        <span className="number-field-fractions">
          <FractionPicker onSelect={applyFractionLabel} />
        </span>
      ) : null}
    </span>
  );
}
