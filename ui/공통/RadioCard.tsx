"use client";

import { CheckIcon, PersonIcon } from "./icons";

/** 04 성별 선택 — 아이콘이 들어간 큰 카드 2장 중 하나 */
export default function RadioCard({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      {label && (
        <p className="mb-1.5 text-[11px] font-bold text-muted">{label}</p>
      )}
      <div className="flex gap-3">
        {options.map((opt) => {
          const on = value === opt;
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={on}
              aria-label={opt}
              onClick={() => onChange(opt)}
              className={`relative flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-4 transition-colors ${
                on
                  ? "border-primary bg-white"
                  : "border-line bg-surface"
              }`}
            >
              <span
                className={`absolute left-3 top-3 flex h-[18px] w-[18px] items-center justify-center rounded-full ${
                  on ? "bg-primary text-white" : "border border-line bg-white"
                }`}
              >
                {on && (
                  <span className="h-2.5 w-2.5">
                    <CheckIcon />
                  </span>
                )}
              </span>
              <span
                className={`h-7 w-7 ${on ? "text-primary" : "text-muted"}`}
              >
                <PersonIcon />
              </span>
              <span
                className={`text-[13px] font-bold ${on ? "text-primary" : "text-muted"}`}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
