import type { ReactNode } from "react";

/** 제목 안에서 강조되는 부분. 시안이 매 화면 앞머리를 강조한다. */
export function Accent({ children }: { children: ReactNode }) {
  return <span className="text-(--color-primary)">{children}</span>;
}

interface StepHeaderProps {
  step?: number;
  title: ReactNode;
  note?: ReactNode;
  noteTone?: "muted" | "warning";
}

export function StepHeader({
  step,
  title,
  note,
  noteTone = "muted",
}: StepHeaderProps) {
  const noteClassName =
    noteTone === "warning"
      ? "text-(--color-warning)"
      : "text-(--color-text-sub)";

  return (
    <header className="mb-6">
      {step !== undefined ? (
        <p className="mb-1.5 text-[11px] font-bold tracking-wide text-(--color-text-sub)">
          STEP {step}
        </p>
      ) : null}
      <h1 className="text-[22px] font-bold leading-snug text-(--color-text-strong)">
        {title}
      </h1>
      {note ? <p className={`mt-1.5 text-[13px] ${noteClassName}`}>{note}</p> : null}
    </header>
  );
}
