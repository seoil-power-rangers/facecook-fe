import { User, X } from "lucide-react";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  online?: boolean;
  suspended?: boolean;
  bgColor?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const personIconSizeClasses: Record<AvatarSize, string> = {
  sm: "h-4.5 w-4.5",
  md: "h-5.5 w-5.5",
  lg: "h-6.5 w-6.5",
  xl: "h-9 w-9",
};

const dotSizeClasses: Record<AvatarSize, string> = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-3.5 w-3.5",
};

const badgeSizeClasses: Record<AvatarSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-4.5 w-4.5",
  xl: "h-5 w-5",
};

const badgeIconSizeClasses: Record<AvatarSize, string> = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-3.5 w-3.5",
};

export function Avatar({ name, size = "md", online, suspended, bgColor }: AvatarProps) {
  return (
    <span className="relative inline-flex shrink-0">
      <span
        role="img"
        aria-label={name}
        className={`flex items-center justify-center rounded-full font-semibold text-(--color-text-on-primary) ${sizeClasses[size]} ${suspended ? "opacity-50" : ""}`}
        style={{ backgroundColor: bgColor ?? "var(--color-primary)" }}
      >
        <User className={personIconSizeClasses[size]} fill="currentColor" strokeWidth={0} />
      </span>
      {suspended ? (
        <span
          className={`absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-(--color-surface) bg-(--color-danger) ${badgeSizeClasses[size]}`}
          aria-label="영구정지된 사용자"
        >
          <X className={`${badgeIconSizeClasses[size]} text-(--color-text-on-primary)`} strokeWidth={3} />
        </span>
      ) : online ? (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-(--color-surface) bg-(--color-online) ${dotSizeClasses[size]}`}
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}
