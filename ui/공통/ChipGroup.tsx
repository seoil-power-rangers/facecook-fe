"use client";

/** 혈액형(04)·학년(07)처럼 하나만 고르는 칩 줄 */
export default function ChipGroup({
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
      <div className="flex gap-2">
        {options.map((opt) => {
          const on = value === opt;
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? "" : opt)}
              className={`h-10 flex-1 rounded-lg text-[13px] font-bold transition-colors ${
                on
                  ? "bg-primary text-white"
                  : "bg-surface text-muted"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
