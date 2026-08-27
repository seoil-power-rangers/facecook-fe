type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  online?: boolean;
  bgColor?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const dotSizeClasses: Record<AvatarSize, string> = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-3.5 w-3.5",
};

export function Avatar({ name, size = "md", online, bgColor }: AvatarProps) {
  const initial = name.charAt(0);

  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={`flex items-center justify-center rounded-full font-semibold text-(--color-text-on-primary) ${sizeClasses[size]}`}
        style={{ backgroundColor: bgColor ?? "var(--color-primary)" }}
      >
        {initial}
      </span>
      {online ? (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-(--color-surface) bg-(--color-online) ${dotSizeClasses[size]}`}
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}
