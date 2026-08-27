"use client";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  /** 오른쪽에 붙는 버튼이나 아이콘 (예: 02의 [인증요청], 07의 검색 아이콘) */
  trailing?: React.ReactNode;
  suffix?: string;
};

/** 시안 기준 높이 50, 배경 #F2F4F9, 테두리 #EBEDF3 */
export default function TextField({
  label,
  trailing,
  suffix,
  className = "",
  ...rest
}: Props) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[11px] font-bold text-muted">
          {label}
        </span>
      )}
      <span className="flex h-[50px] items-center gap-2 rounded-xl border border-line bg-surface px-4">
        <input
          {...rest}
          className={`min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted ${className}`}
        />
        {suffix && <span className="text-[14px] text-muted">{suffix}</span>}
        {trailing}
      </span>
    </label>
  );
}
