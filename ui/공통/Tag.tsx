import type { ReactNode } from "react";

type TagVariant = "primary" | "accent" | "default" | "warning" | "success";

interface TagProps {
  children: ReactNode;
  variant?: TagVariant;
}

const variantClasses: Record<TagVariant, string> = {
  primary: "bg-(--color-primary-light) text-(--color-primary)",
  accent: "bg-(--color-accent-soft) text-(--color-accent)",
  default: "bg-(--color-disabled-bg) text-(--color-text-sub)",
  warning: "bg-(--color-warning)/15 text-(--color-warning)",
  success: "bg-(--color-success)/15 text-(--color-success)",
};

export function Tag({ children, variant = "default" }: TagProps) {
  return (
    <span
      className={`inline-flex h-5 items-center whitespace-nowrap rounded-full px-2 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
