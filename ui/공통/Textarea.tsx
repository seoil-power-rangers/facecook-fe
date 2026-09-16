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
      {/*
        hint를 라벨에 이어 붙이면 "자기소개 선택"처럼 한 덩어리로 읽혀서 라벨
        자체가 바뀐 것처럼 보인다. 오른쪽 끝으로 떼어놓으면 라벨은 라벨대로,
        부가 정보는 부가 정보대로 읽힌다.
      */}
      {label ? (
        <span className="mb-1.5 flex items-baseline justify-between gap-2 text-[11px] font-bold text-(--color-text-sub)">
          <span>{label}</span>
          {hint ? (
            <span className="font-normal text-(--color-text-muted)">{hint}</span>
          ) : null}
        </span>
      ) : null}
      {/* 16px 미만으로 줄이지 말 것 — iOS가 포커스 시 화면을 확대한다. */}
      <textarea
        className={`w-full resize-none rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-alt) px-4 py-3 text-[16px] leading-relaxed text-(--color-text-strong) outline-none placeholder:text-(--color-text-muted) ${className ?? ""}`}
        {...props}
      />
    </label>
  );
}
