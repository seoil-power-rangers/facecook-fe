"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Gift, Lock } from "lucide-react";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";

type StepStatus = "done" | "progress" | "locked";

interface MissionStep {
  step: number;
  status: StepStatus;
  title: string;
  description: string;
  meta?: string;
}

const missionSteps: MissionStep[] = [
  {
    step: 1,
    status: "done",
    title: "둘이 함께 인증사진 찍기",
    description: "부스에서 인증받고 선물을 받았어요.",
    meta: "음료 쿠폰 받음 · 09:58 인증",
  },
  {
    step: 2,
    status: "progress",
    title: "부스 미션 카드 뽑고 수행하기",
    description: "카드에 적힌 미션을 함께 하고 부스에서 인증받으세요.",
  },
  {
    step: 3,
    status: "locked",
    title: "",
    description: "STEP 2를 완료하면 열려요",
  },
];

const CURRENT_STEP = 2;
const LAST_COMPLETED_STEP = 1;

export function MissionScreen({ partnerName }: { partnerName: string }) {
  const router = useRouter();

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-(--color-border) bg-(--color-surface) px-3">
        <button type="button" aria-label="뒤로가기" className="p-1" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5 text-(--color-text-strong)" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-(--color-text-strong)">미션</h1>
        <span className="w-7" aria-hidden="true" />
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs text-(--color-text-sub)">{partnerName}님과 함께</p>
            <p className="mt-1 text-lg font-bold text-(--color-text-strong)">
              <span className="text-(--color-primary)">STEP {LAST_COMPLETED_STEP}</span> 완료!
            </p>
            <p className="mt-0.5 text-sm text-(--color-text-sub)">부스에서 인증받고 선물을 받았어요.</p>
          </div>

          <StepIndicator currentStep={CURRENT_STEP} />

          <div className="flex flex-col gap-3">
            {missionSteps.map((mission) => (
              <MissionCard key={mission.step} mission={mission} />
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-(--radius-lg) bg-(--color-success)/10 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-surface) text-(--color-success)">
              <Gift className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs text-(--color-text-sub)">STEP 3까지 완료하면</span>
              <span className="text-sm font-bold text-(--color-text-strong)">최종 선물을 받을 수 있어요</span>
            </div>
          </div>
        </div>
      </main>
    </PhoneFrame>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [1, 2, 3];

  return (
    <div className="flex items-center px-2">
      {steps.map((step, index) => {
        const isDone = step < currentStep;
        const isCurrent = step === currentStep;
        const isLast = index === steps.length - 1;

        let nodeClassName = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold";
        if (isDone) {
          nodeClassName += " bg-(--color-success) text-(--color-text-on-primary)";
        } else if (isCurrent) {
          nodeClassName += " bg-(--color-primary) text-(--color-text-on-primary)";
        } else {
          nodeClassName += " border-2 border-(--color-border) text-(--color-text-muted)";
        }

        let lineClassName = "h-0.5 flex-1";
        lineClassName += step < currentStep ? " bg-(--color-success)" : " bg-(--color-border)";

        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <span className={nodeClassName}>{isDone ? <Check className="h-4 w-4" /> : step}</span>
            {!isLast ? <span className={lineClassName} aria-hidden="true" /> : null}
          </div>
        );
      })}
    </div>
  );
}

function MissionCard({ mission }: { mission: MissionStep }) {
  if (mission.status === "locked") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-(--radius-lg) bg-(--color-disabled-bg) p-3">
        <div className="flex flex-col gap-1">
          <Tag variant="default">STEP {mission.step}</Tag>
          <p className="text-sm text-(--color-text-muted)">{mission.description}</p>
        </div>
        <Lock className="h-4 w-4 shrink-0 text-(--color-text-muted)" aria-hidden="true" />
      </div>
    );
  }

  if (mission.status === "progress") {
    return (
      <div className="flex flex-col gap-2 rounded-(--radius-lg) bg-(--color-primary-lighter) p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Tag variant="primary">STEP {mission.step}</Tag>
            <Tag variant="warning">진행 중</Tag>
          </div>
          <Gift className="h-4 w-4 text-(--color-text-sub)" aria-hidden="true" />
        </div>
        <p className="text-sm font-bold text-(--color-text-strong)">{mission.title}</p>
        <p className="text-xs text-(--color-text-sub)">{mission.description}</p>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Tag variant="default">STEP {mission.step}</Tag>
          <Tag variant="success">완료</Tag>
        </div>
        <p className="text-sm font-bold text-(--color-text-strong)">{mission.title}</p>
        {mission.meta ? (
          <div className="flex items-center gap-1 text-xs text-(--color-text-sub)">
            <Gift className="h-3 w-3" />
            {mission.meta}
          </div>
        ) : null}
      </div>
      <Check className="mt-1 h-4 w-4 shrink-0 text-(--color-success)" aria-hidden="true" />
    </div>
  );
}
