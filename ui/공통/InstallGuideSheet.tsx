"use client";

import { Plus, Share } from "lucide-react";
import { Button } from "./Button";

/**
 * 아이폰 안내. 사파리는 설치 프롬프트를 띄울 방법이 없어서 순서만 알려준다.
 * 기능명세 8절 — 아이폰은 홈 화면에 추가돼 있어야 푸시 알림을 받는다.
 */
const steps = [
  { icon: Share, text: "사파리 하단의 공유 버튼을 누르세요" },
  { icon: Plus, text: "목록에서 「홈 화면에 추가」를 고르세요" },
];

export function InstallGuideSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4 px-6 pt-2">
      <div className="flex flex-col gap-1">
        <p className="text-xl font-bold text-(--color-text-strong)">홈 화면에 추가하기</p>
        <p className="text-sm text-(--color-text-sub)">
          아이폰은 홈 화면에 추가해야 콕·매칭 알림을 받을 수 있어요.
        </p>
      </div>

      <ol className="flex flex-col gap-3 rounded-(--radius-lg) bg-(--color-surface-alt) p-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <li key={step.text} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--color-primary) text-xs font-bold text-(--color-text-on-primary)">
                {index + 1}
              </span>
              <span className="flex flex-1 items-center gap-2 text-sm text-(--color-text-body)">
                {step.text}
                <Icon className="h-4 w-4 shrink-0 text-(--color-primary)" aria-hidden="true" />
              </span>
            </li>
          );
        })}
      </ol>

      <Button fullWidth onClick={onClose}>
        알겠어요
      </Button>
    </div>
  );
}
