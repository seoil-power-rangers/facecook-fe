import { PROGRESS_SLOTS } from "./constants";

/** 온보딩 상단 진행바. STEP 번호만큼 채워진다. */
export function ProgressBar({ step }: { step: number }) {
  return (
    <div
      className="flex gap-1"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={0}
      aria-valuemax={PROGRESS_SLOTS}
    >
      {Array.from({ length: PROGRESS_SLOTS }, (_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-(--radius-full) ${
            i < step ? "bg-(--color-primary)" : "bg-(--color-border)"
          }`}
        />
      ))}
    </div>
  );
}
