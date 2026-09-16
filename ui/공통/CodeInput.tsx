"use client";

import { useRef, useState } from "react";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length: number;
  disabled?: boolean;
  /** 만료됐을 때처럼 입력값을 다시 받아야 하는 상태 */
  invalid?: boolean;
  label?: string;
}

/**
 * 인증번호를 한 칸에 한 글자씩 받는 입력.
 *
 * 칸을 여섯 개로 나누면 몇 자리인지 세어보지 않아도 보이고, 어디까지 쳤는지가
 * 남는다 — 메일 앱과 번갈아 보며 옮겨 적는 상황이라 그게 오타를 줄인다.
 *
 * 칸마다 input을 두지 않고 투명한 input 하나를 위에 덮는다. 칸을 나누면
 * 붙여넣기·백스페이스·자동완성(문자 인증코드)을 전부 직접 처리해야 하는데,
 * 실제 입력은 하나로 두면 브라우저가 알아서 하고 화면만 나눠 그리면 된다.
 */
export function CodeInput({
  value,
  onChange,
  length,
  disabled = false,
  invalid = false,
  label,
}: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const digits = Array.from({ length }, (_, index) => value[index] ?? "");
  const caretAt = focused && !disabled ? Math.min(value.length, length - 1) : -1;

  return (
    <div
      className="relative"
      onClick={() => inputRef.current?.focus()}
    >
      <div className={`flex gap-1.5 ${disabled ? "opacity-50" : ""}`}>
        {digits.map((digit, index) => {
          const active = index === caretAt && !digit;

          let boxClassName =
            "flex h-[52px] flex-1 items-center justify-center rounded-(--radius-md) border text-[20px] font-bold text-(--color-text-strong) transition-colors";
          if (invalid) {
            boxClassName += " border-(--color-danger) bg-(--color-surface)";
          } else if (digit) {
            boxClassName += " border-(--color-primary) bg-(--color-surface)";
          } else if (active) {
            boxClassName += " border-(--color-primary) bg-(--color-surface)";
          } else {
            boxClassName +=
              " border-(--color-border) bg-(--color-surface-alt)";
          }

          return (
            <div key={index} className={boxClassName}>
              {digit ||
                (active ? (
                  <span className="h-5 w-[2px] animate-pulse bg-(--color-primary)" />
                ) : null)}
            </div>
          );
        })}
      </div>

      {/*
        실제로 글자를 받는 칸. 화면에는 안 보이지만 자리는 그대로 차지해서
        어디를 눌러도 여기에 포커스가 간다.
        16px 미만으로 줄이지 말 것 — iOS가 포커스 시 화면을 확대한다.
      */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={label}
        maxLength={length}
        disabled={disabled}
        value={value}
        onChange={(event) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, length))
        }
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="absolute inset-0 h-full w-full cursor-default text-[16px] opacity-0 outline-none"
      />
    </div>
  );
}
