/** 제목 안에서 파랗게 강조되는 부분. 시안이 매 화면 앞머리를 강조한다. */
export function Accent({ children }: { children: React.ReactNode }) {
  return <span className="text-primary">{children}</span>;
}

export default function StepHeader({
  step,
  title,
  note,
  noteTone = "muted",
}: {
  step?: number;
  title: React.ReactNode;
  note?: React.ReactNode;
  noteTone?: "muted" | "warn";
}) {
  return (
    <header className="mb-6">
      {step !== undefined && (
        <p className="mb-1.5 text-[11px] font-bold tracking-wide text-muted">
          STEP {step}
        </p>
      )}
      <h1 className="text-[22px] font-bold leading-snug">{title}</h1>
      {note && (
        <p
          className={`mt-1.5 text-[13px] ${noteTone === "warn" ? "text-warn" : "text-muted"}`}
        >
          {note}
        </p>
      )}
    </header>
  );
}
