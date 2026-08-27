"use client";

interface ChipGroupProps {
  label?: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

/** 혈액형·학년처럼 하나만 고르는 칩 줄 */
export function ChipGroup({ label, options, value, onChange }: ChipGroupProps) {
  return (
    <div>
      {label ? (
        <p className="mb-1.5 text-[11px] font-bold text-(--color-text-sub)">
          {label}
        </p>
      ) : null}
      <div className="flex gap-2">
        {options.map((option) => {
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? "" : option)}
              className={`h-10 flex-1 rounded-(--radius-sm) text-[13px] font-bold transition-colors ${
                selected
                  ? "bg-(--color-primary) text-(--color-text-on-primary)"
                  : "bg-(--color-surface-alt) text-(--color-text-sub)"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
