"use client";

import { CheckIcon } from "./icons";

/**
 * 03 약관, 05 성향 태그처럼 체크 동그라미가 왼쪽에 붙는 줄.
 * 줄 전체가 눌린다 — 동그라미만 누르게 하면 손가락으로 맞히기 어렵다.
 * trailing(약관 보기 화살표)은 따로 눌러야 하므로 버튼 밖에 둔다.
 */
export default function CheckRow({
  checked,
  onToggle,
  children,
  label,
  trailing,
  filled = false,
  disabled = false,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  /** 스크린리더용 이름. 생략하면 children의 글자를 읽는다. */
  label?: string;
  trailing?: React.ReactNode;
  /** true면 선택 시 배경·테두리까지 강조한다 (05 성향 태그) */
  filled?: boolean;
  disabled?: boolean;
}) {
  const box = filled
    ? checked
      ? "border border-primary bg-primary-soft"
      : "border border-transparent bg-surface"
    : "";

  return (
    <div
      className={`flex items-center rounded-xl ${filled ? "h-11 pr-3.5" : ""} ${box}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        className={`flex flex-1 items-center gap-2.5 text-left disabled:opacity-60 ${
          filled ? "h-full pl-3.5" : "py-2"
        }`}
      >
        <span
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition-colors ${
            checked ? "bg-primary text-white" : "bg-line text-white"
          }`}
        >
          <span className="h-3 w-3">
            <CheckIcon />
          </span>
        </span>
        <span
          className={`flex-1 text-[14px] ${checked ? "text-ink" : "text-muted"}`}
        >
          {children}
        </span>
      </button>
      {trailing}
    </div>
  );
}
