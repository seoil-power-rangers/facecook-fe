"use client";

import { Avatar } from "./Avatar";
import { Button } from "./Button";

interface KokConfirmSheetProps {
  name: string;
  userId: number;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const rules = [
  "1시간 안에 답이 없으면 자동 만료돼요",
  "상대가 맞콕하기 전까지는 취소할 수 있어요",
  "취소하거나 만료돼도 오늘 횟수는 되돌아오지 않아요",
];

export function KokConfirmSheet({
  name,
  userId,
  onCancel,
  onConfirm,
  isSubmitting = false,
}: KokConfirmSheetProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 pt-2">
      <Avatar name={name} size="xl" userId={userId} />

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm text-(--color-text-sub)">{name}님에게</p>
        <p className="text-xl font-bold text-(--color-text-strong)">콕 보낼까요?</p>
        <p className="text-sm text-(--color-text-sub)">1시간 안에 상대도 콕하면 매칭돼요.</p>
      </div>

      <ul className="flex w-full flex-col gap-2 rounded-(--radius-lg) bg-(--color-surface-alt) p-4">
        {rules.map((rule) => (
          <li key={rule} className="flex items-start gap-2 text-xs text-(--color-text-sub)">
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-(--color-text-muted)"
              aria-hidden="true"
            />
            {rule}
          </li>
        ))}
      </ul>

      <div className="flex w-full items-center justify-between rounded-(--radius-lg) bg-(--color-primary-lighter) px-4 py-3">
        <span className="text-sm font-medium text-(--color-text-strong)">보내면 오늘 남은 콕</span>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-(--color-primary)" aria-hidden="true" />
          <span className="h-2 w-2 rounded-full bg-(--color-primary)" aria-hidden="true" />
          <span
            className="h-2 w-2 rounded-full border border-(--color-border-strong)"
            aria-hidden="true"
          />
        </div>
      </div>

      <Button fullWidth onClick={onConfirm} disabled={isSubmitting}>
        {isSubmitting ? "보내는 중..." : "콕 보내기"}
      </Button>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="text-sm text-(--color-text-sub) disabled:text-(--color-disabled-text)"
      >
        취소
      </button>
    </div>
  );
}
