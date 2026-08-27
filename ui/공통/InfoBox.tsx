import { Lock } from "lucide-react";
import type { ReactNode } from "react";

type InfoBoxTone = "muted" | "info" | "danger";

const toneClasses: Record<InfoBoxTone, string> = {
  muted: "bg-(--color-surface-alt) text-(--color-text-sub)",
  info: "bg-(--color-primary-light) text-(--color-primary)",
  danger: "bg-(--color-danger-light) text-(--color-danger)",
};

interface InfoBoxProps {
  tone?: InfoBoxTone;
  icon?: ReactNode;
  children: ReactNode;
}

/** 안내 박스 3종 — 회색(자물쇠) / 보라(문의) / 빨강(경고) */
export function InfoBox({ tone = "muted", icon, children }: InfoBoxProps) {
  const showLock = icon === undefined && tone === "muted";

  return (
    <div
      className={`flex gap-2 rounded-(--radius-md) px-4 py-3 text-[13px] leading-relaxed ${toneClasses[tone]}`}
    >
      {icon ?? (showLock ? <Lock className="mt-0.5 h-4 w-4 shrink-0" /> : null)}
      <div className="flex-1">{children}</div>
    </div>
  );
}
