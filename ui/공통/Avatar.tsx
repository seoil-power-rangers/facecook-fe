import { User, X } from "lucide-react";
import { avatarColor, avatarEmoji } from "./avatarColor";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  online?: boolean;
  suspended?: boolean;
  bgColor?: string;
  emoji?: string;
  /**
   * 넘기면 색과 얼굴을 이 값으로 정한다. 같은 사람이 어느 화면에서든 같은
   * 모습이 되도록, 화면마다 따로 계산하지 않고 여기 한 곳에서 처리한다.
   */
  userId?: number;
  /** 오른쪽 아래에 붙는 작은 표시. 매칭된 상대에게 하트를 단다. */
  badge?: string;
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

const emojiSizeClasses: Record<AvatarSize, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-4xl",
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

export function Avatar({
  name,
  size = "md",
  online,
  suspended,
  bgColor,
  emoji,
  userId,
  badge,
}: AvatarProps) {
  const face = emoji ?? (userId === undefined ? undefined : avatarEmoji(userId));
  const background =
    bgColor ?? (userId === undefined ? "var(--color-primary)" : avatarColor(userId));

  return (
    <span className="relative inline-flex shrink-0">
      <span
        role="img"
        aria-label={name}
        className={`flex items-center justify-center rounded-full font-semibold text-(--color-text-on-primary) ${sizeClasses[size]} ${suspended ? "opacity-50" : ""}`}
        style={{ backgroundColor: background }}
      >
        {face ? (
          <span className={emojiSizeClasses[size]}>{face}</span>
        ) : (
          <User className={personIconSizeClasses[size]} fill="currentColor" strokeWidth={0} />
        )}
      </span>
      {suspended ? (
        <span
          className={`absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-(--color-surface) bg-(--color-danger) ${badgeSizeClasses[size]}`}
          aria-label="영구정지된 사용자"
        >
          <X className={`${badgeIconSizeClasses[size]} text-(--color-text-on-primary)`} strokeWidth={3} />
        </span>
      ) : badge ? (
        <span
          className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center ${badgeSizeClasses[size]}`}
          aria-hidden="true"
        >
          {badge}
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
