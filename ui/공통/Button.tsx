"use client";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

/** 시안 기준 높이 54, 좌우 여백 20을 뺀 폭(340)을 채운다. */
export default function Button({
  variant = "primary",
  className = "",
  ...rest
}: Props) {
  const tone =
    variant === "primary"
      ? "bg-primary text-white disabled:bg-line disabled:text-muted"
      : "bg-white text-ink border border-line";

  return (
    <button
      {...rest}
      className={`h-[54px] w-full rounded-xl text-[15.5px] font-bold transition-opacity active:opacity-80 disabled:cursor-not-allowed ${tone} ${className}`}
    />
  );
}
