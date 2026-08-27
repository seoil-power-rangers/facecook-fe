import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "lg" | "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-(--color-primary) text-(--color-text-on-primary) hover:bg-(--color-primary-hover) active:bg-(--color-primary-pressed) disabled:bg-(--color-disabled-bg) disabled:text-(--color-disabled-text)",
  secondary:
    "border border-(--color-border) bg-(--color-surface) text-(--color-text-strong) active:bg-(--color-surface-alt) disabled:border-(--color-disabled-border) disabled:text-(--color-disabled-text)",
  outline:
    "border border-(--color-primary) bg-(--color-surface) text-(--color-primary) active:bg-(--color-primary-lighter) disabled:border-(--color-disabled-border) disabled:text-(--color-disabled-text)",
  ghost:
    "bg-transparent text-(--color-primary) active:bg-(--color-primary-lighter) disabled:text-(--color-disabled-text)",
};

const sizeClasses: Record<ButtonSize, string> = {
  lg: "h-[54px] px-6 text-base",
  md: "h-[50px] px-5 text-sm",
  sm: "h-9 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "lg",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-(--radius-lg) font-semibold transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      )}
      {...props}
    />
  );
}
