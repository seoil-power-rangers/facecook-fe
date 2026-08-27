"use client";

import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  /** 라벨 옆 작은 회색 글씨 (예: "선택") */
  hint?: string;
}

export function Textarea({ label, hint, className, ...props }: TextareaProps) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-[11px] font-bold text-(--color-text-sub)">
          {label}
          {hint ? <span className="ml-1 font-normal">{hint}</span> : null}
        </span>
      ) : null}
      <textarea
        className={`w-full resize-none rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-alt) px-4 py-3 text-[14px] leading-relaxed text-(--color-text-strong) outline-none placeholder:text-(--color-text-muted) ${className ?? ""}`}
        {...props}
      />
    </label>
  );
}
