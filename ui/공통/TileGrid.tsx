"use client";

import { Check } from "lucide-react";
import { ACTIVITY_ICONS } from "./icons";

interface TileGridProps {
  label?: string;
  options: readonly string[];
  value: string[];
  /** 항목 하나만 넘긴다 — 배열을 넘기면 연타 시 앞선 선택이 덮인다. */
  onToggle: (option: string) => void;
}

/** 활동 선택 — 3열 타일, 여러 개 고를 수 있다 */
export function TileGrid({ label, options, value, onToggle }: TileGridProps) {
  return (
    <div>
      {label ? (
        <p className="mb-1.5 text-[11px] font-bold text-(--color-text-sub)">
          {label}
        </p>
      ) : null}
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
              /*
               * 안 고른 타일도 흰 바탕에 테두리를 준다. 회색 바탕에 회색 글씨면
               * 12칸이 통째로 흐릿한 덩어리가 돼서 "누를 수 있는 것"으로 안
               * 읽힌다 — 고르기 전에는 전부 비활성처럼 보이는 셈이다.
               */
              className={`relative flex flex-col items-center gap-2 rounded-(--radius-md) border py-4 transition-colors ${
                selected
                  ? "border-(--color-primary) bg-(--color-surface)"
                  : "border-(--color-border) bg-(--color-surface)"
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
                      : "text-(--color-text-sub)"
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
    </div>
  );
}
