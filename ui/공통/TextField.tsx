"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** 오른쪽에 붙는 버튼이나 아이콘 (예: [인증요청], 검색 아이콘) */
  trailing?: ReactNode;
  suffix?: string;
  /**
   * soft는 테두리 없이 연보라로 채운다. 흰 바탕이 아닌 화면(로그인)에서
   * 기본형을 쓰면 입력칸이 바탕에 묻혀서 눌러야 할 곳이 안 보인다.
   */
  tone?: "default" | "soft";
}

const toneClasses: Record<"default" | "soft", string> = {
  default: "border border-(--color-border) bg-(--color-surface-alt)",
  soft: "border border-transparent bg-(--color-primary-light)",
};

export function TextField({
  label,
  trailing,
  suffix,
  tone = "default",
  className,
  ...props
}: TextFieldProps) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-[11px] font-bold text-(--color-text-sub)">
          {label}
        </span>
      ) : null}
      <span
        className={`flex h-[50px] items-center gap-2 rounded-(--radius-md) px-4 ${toneClasses[tone]}`}
      >
        {/* 16px 미만으로 줄이지 말 것 — iOS가 포커스 시 화면을 확대한다. */}
        <input
          className={`min-w-0 flex-1 bg-transparent text-[16px] text-(--color-text-strong) outline-none placeholder:text-(--color-text-muted) ${className ?? ""}`}
          {...props}
        />
        {suffix ? (
          <span className="text-[14px] text-(--color-text-sub)">{suffix}</span>
        ) : null}
        {trailing}
      </span>
    </label>
  );
}
