"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** 오른쪽에 붙는 버튼이나 아이콘 (예: [인증요청], 검색 아이콘) */
  trailing?: ReactNode;
  suffix?: string;
}

export function TextField({
  label,
  trailing,
  suffix,
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
      <span className="flex h-[50px] items-center gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-alt) px-4">
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
