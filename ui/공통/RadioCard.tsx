"use client";

import { Check, User } from "lucide-react";

interface RadioCardProps {
  label?: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

/** 성별 선택 — 아이콘이 들어간 큰 카드 2장 중 하나 */
export function RadioCard({ label, options, value, onChange }: RadioCardProps) {
  return (
    <div>
      {label ? (
        <p className="mb-1.5 text-[11px] font-bold text-(--color-text-sub)">
          {label}
        </p>
      ) : null}
      <div className="flex gap-3">
        {options.map((option) => {
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              aria-label={option}
              onClick={() => onChange(option)}
              className={`relative flex flex-1 flex-col items-center gap-1.5 rounded-(--radius-md) border py-4 transition-colors ${
                selected
                  ? "border-(--color-primary) bg-(--color-surface)"
                  : "border-(--color-border) bg-(--color-surface-alt)"
              }`}
            >
              <span
                className={`absolute left-3 top-3 flex h-[18px] w-[18px] items-center justify-center rounded-(--radius-full) ${
                  selected
                    ? "bg-(--color-primary) text-(--color-text-on-primary)"
                    : "border border-(--color-border) bg-(--color-surface)"
                }`}
              >
                {selected ? <Check className="h-2.5 w-2.5" /> : null}
              </span>
              <User
                className={`h-7 w-7 ${
                  selected
                    ? "text-(--color-primary)"
                    : "text-(--color-text-muted)"
                }`}
              />
              <span
                className={`text-[13px] font-bold ${
                  selected
                    ? "text-(--color-primary)"
                    : "text-(--color-text-sub)"
                }`}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
