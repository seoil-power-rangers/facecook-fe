"use client";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  /** 라벨 옆 작은 회색 글씨 (예: "선택") */
  hint?: string;
};

export default function Textarea({ label, hint, className = "", ...rest }: Props) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[11px] font-bold text-muted">
          {label}
          {hint && <span className="ml-1 font-normal">{hint}</span>}
        </span>
      )}
      <textarea
        {...rest}
        className={`w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-[14px] leading-relaxed outline-none placeholder:text-muted ${className}`}
      />
    </label>
  );
}
