"use client";

import { Check } from "lucide-react";
import { ACTIVITY_ICONS } from "./icons";

interface TileGridProps {
  options: readonly string[];
  value: string[];
  /** 항목 하나만 넘긴다 — 배열을 넘기면 연타 시 앞선 선택이 덮인다. */
  onToggle: (option: string) => void;
}

/** 활동 선택 — 3열 타일, 여러 개 고를 수 있다 */
export function TileGrid({ options, value, onToggle }: TileGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {options.map((option) => {
        const selected = value.includes(option);
        const Icon = ACTIVITY_ICONS[option];

        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            aria-label={option}
            onClick={() => onToggle(option)}
            className={`relative flex flex-col items-center gap-2 rounded-(--radius-md) border py-4 transition-colors ${
              selected
                ? "border-(--color-primary) bg-(--color-surface)"
                : "border-transparent bg-(--color-surface-alt)"
            }`}
          >
            <span
              className={`absolute left-2.5 top-2.5 flex h-[18px] w-[18px] items-center justify-center rounded-(--radius-full) ${
                selected
                  ? "bg-(--color-primary) text-(--color-text-on-primary)"
                  : "border border-(--color-border) bg-(--color-surface)"
              }`}
            >
              {selected ? <Check className="h-2.5 w-2.5" /> : null}
            </span>
            {Icon ? (
              <Icon
                className={`h-6 w-6 ${
                  selected
                    ? "text-(--color-primary)"
                    : "text-(--color-text-muted)"
                }`}
              />
            ) : null}
            <span
              className={`text-[12px] font-bold ${
                selected ? "text-(--color-primary)" : "text-(--color-text-sub)"
              }`}
            >
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}
