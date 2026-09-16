"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

interface CheckRowProps {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** 스크린리더용 이름. 생략하면 children의 글자를 읽는다. */
  label?: string;
  trailing?: ReactNode;
  /** true면 선택 시 배경·테두리까지 강조한다 (성향 태그) */
  filled?: boolean;
  disabled?: boolean;
}

/**
 * 체크 동그라미가 왼쪽에 붙는 줄.
 * 줄 전체가 눌린다 — 동그라미만 누르게 하면 손가락으로 맞히기 어렵다.
 * trailing(약관 보기 화살표)은 따로 눌러야 하므로 버튼 밖에 둔다.
 */
export function CheckRow({
  checked,
  onToggle,
  children,
  label,
  trailing,
  filled = false,
  disabled = false,
}: CheckRowProps) {
  let boxClassName = "flex items-center rounded-(--radius-md)";
  if (filled) {
    boxClassName += " h-11 border pr-3.5";
    boxClassName += checked
      ? " border-(--color-primary) bg-(--color-primary-light)"
      : " border-transparent bg-(--color-surface-alt)";
  }

  return (
    <div className={boxClassName}>
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
        {/*
          안 고른 칸은 빈 동그라미로 둔다. 회색이어도 체크 표시가 그려져 있으면
          "이미 체크됐는데 색만 죽은 것"으로 읽혀서, 약관 화면에서 동의한 줄
          알고 넘어가려다 버튼이 안 눌리는 일이 생긴다.
        */}
        <span
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-(--radius-full) text-(--color-text-on-primary) transition-colors ${
            checked
              ? "bg-(--color-primary)"
              : "border-2 border-(--color-border-strong)"
          }`}
        >
          {checked ? <Check className="h-3 w-3" /> : null}
        </span>
        <span
          className={`flex-1 text-[14px] ${
            checked ? "text-(--color-text-strong)" : "text-(--color-text-sub)"
          }`}
        >
          {children}
        </span>
      </button>
      {trailing}
    </div>
  );
}
