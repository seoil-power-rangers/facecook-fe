"use client";

import { Avatar } from "./Avatar";
import { Button } from "./Button";

interface KokConfirmSheetProps {
  name: string;
  userId: number;
  /** 아직 쓰지 않은 오늘의 콕 개수. 아직 모르면 null. */
  remaining: number | null;
  /** 하루 한도. 서버가 정하므로 화면에 박아두지 않는다. 모르면 null. */
  dailyLimit: number | null;
  photoUrl?: string | null;
  gender?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const rules = [
  "상대가 맞콕하면 바로 매칭돼요",
  "상대가 맞콕하기 전까지는 취소할 수 있어요",
  "취소해도 오늘 횟수는 되돌아오지 않아요",
];

export function KokConfirmSheet({
  name,
  userId,
  remaining,
  dailyLimit,
  photoUrl,
  gender,
  onCancel,
  onConfirm,
  isSubmitting = false,
}: KokConfirmSheetProps) {
  /*
   * 사용량 조회가 실패하면 0이 아니라 "모름"이다. 0으로 뭉뚱그리면 콕이
   * 남아 있는데도 버튼이 잠긴다 — 조회 한 번 실패했다고 보낼 수 있는 콕을
   * 막는 건 서버가 거절하는 것보다 나쁘다.
   */
  const knowsUsage = remaining !== null && dailyLimit !== null && dailyLimit > 0;
  const isEmpty = knowsUsage && remaining <= 0;
  const afterSending = knowsUsage ? Math.max(remaining - 1, 0) : 0;

  return (
    <div className="flex flex-col items-center gap-4 px-6 pt-2">
      <Avatar name={name} size="xl" userId={userId} photoUrl={photoUrl} gender={gender} />

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm text-(--color-text-sub)">{name}님에게</p>
        <p className="text-xl font-bold text-(--color-text-strong)">콕 보낼까요?</p>
        <p className="text-sm text-(--color-text-sub)">상대도 콕하면 매칭돼요.</p>
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

      {/*
        하루 한도가 10개로 늘면서 점 표시를 걷어냈다. 열 개를 점으로 찍으면
        한눈에 세기 어렵고, 남은 개수를 정확히 읽는 게 이 줄의 목적이다.
      */}
      {knowsUsage ? (
      <div className="flex w-full items-center justify-between rounded-(--radius-lg) bg-(--color-accent-soft) px-4 py-3">
        <span className="text-sm font-medium text-(--color-text-strong)">
          {isEmpty
            ? "오늘 콕을 다 썼어요"
            : afterSending === 0
              ? "오늘 마지막 콕이에요"
              : "보내면 오늘 남은 콕"}
        </span>
        <span className="flex items-baseline gap-0.5 tabular-nums">
          <span className="text-lg font-bold text-(--color-accent)">{afterSending}</span>
          <span className="text-sm text-(--color-text-muted)">/ {dailyLimit}</span>
        </span>
      </div>
      ) : null}

      <Button variant="accent" fullWidth onClick={onConfirm} disabled={isSubmitting || isEmpty}>
        {isSubmitting ? "보내는 중..." : isEmpty ? "내일 다시 보낼 수 있어요" : "콕 보내기"}
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
