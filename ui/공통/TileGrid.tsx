"use client";

import { ACTIVITY_ICONS, CheckIcon } from "./icons";

/** 06 활동 선택 — 3열 타일, 여러 개 고를 수 있다 */
export default function TileGrid({
  options,
  value,
  onToggle,
}: {
  options: readonly string[];
  value: string[];
  /** 항목 하나만 넘긴다 — 배열을 넘기면 연타 시 앞선 선택이 덮인다. */
  onToggle: (option: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {options.map((opt) => {
        const on = value.includes(opt);
        const Icon = ACTIVITY_ICONS[opt];
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            aria-label={opt}
            onClick={() => onToggle(opt)}
            className={`relative flex flex-col items-center gap-2 rounded-xl border py-4 transition-colors ${
              on ? "border-primary bg-white" : "border-transparent bg-surface"
            }`}
          >
            <span
              className={`absolute left-2.5 top-2.5 flex h-[18px] w-[18px] items-center justify-center rounded-full ${
                on ? "bg-primary text-white" : "border border-line bg-white"
              }`}
            >
              {on && (
                <span className="h-2.5 w-2.5">
                  <CheckIcon />
                </span>
              )}
            </span>
            <span className={`h-6 w-6 ${on ? "text-primary" : "text-muted"}`}>
              {Icon ? <Icon /> : null}
            </span>
            <span
              className={`text-[12px] font-bold ${on ? "text-primary" : "text-muted"}`}
            >
              {opt}
            </span>
          </button>
        );
      })}
    </div>
  );
}
