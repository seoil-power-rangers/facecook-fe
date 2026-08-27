import { LockIcon } from "./icons";

type Tone = "muted" | "info" | "danger";

const TONES: Record<Tone, string> = {
  muted: "bg-surface text-muted",
  info: "bg-primary-soft text-primary",
  danger: "bg-danger/10 text-danger",
};

/** 시안의 안내 박스 3종 — 회색(자물쇠) / 파랑(문의) / 빨강(경고) */
export default function InfoBox({
  tone = "muted",
  icon,
  children,
}: {
  tone?: Tone;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const showLock = icon === undefined && tone === "muted";

  return (
    <div className={`flex gap-2 rounded-xl px-4 py-3 text-[13px] leading-relaxed ${TONES[tone]}`}>
      {(icon || showLock) && (
        <span className="mt-0.5 h-4 w-4 shrink-0">
          {icon ?? <LockIcon />}
        </span>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}
