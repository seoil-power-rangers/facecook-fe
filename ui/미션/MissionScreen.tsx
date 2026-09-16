"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Gift, Lock } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";
import { MissionStatusCard } from "./MissionStatusCard";
import { connectMissionSocket } from "./missionSocket";
import {
  getMatch,
  matchErrorMessage,
  type MatchResponse,
} from "@ui/매칭/matchApi";
import {
  getMissionProgress,
  MissionApiError,
  missionErrorMessage,
  type MissionProgressResponse,
} from "./missionApi";

type StepStatus = "done" | "progress" | "locked";

interface MissionStep {
  step: number;
  status: StepStatus;
  title: string;
  description: string;
  meta?: string;
}

export function MissionScreen({ matchId }: { matchId: string }) {
  const router = useRouter();
  const numericMatchId = Number(matchId);
  const [progress, setProgress] = useState<MissionProgressResponse | null>(null);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMission = useCallback(async () => {
    if (!Number.isInteger(numericMatchId) || numericMatchId <= 0) {
      setError("올바르지 않은 미션 주소예요.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [missionProgress, matchDetail] = await Promise.all([
        getMissionProgress(numericMatchId),
        getMatch(numericMatchId),
      ]);
      setProgress(missionProgress);
      setMatch(matchDetail);
    } catch (loadError) {
      setError(
        loadError instanceof MissionApiError
          ? missionErrorMessage(loadError)
          : matchErrorMessage(loadError),
      );
    } finally {
      setIsLoading(false);
    }
  }, [numericMatchId]);

  useEffect(() => {
    // 라우트의 matchId가 바뀌면 해당 매칭의 미션 진행 상태를 다시 불러온다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMission();
  }, [loadMission]);

  useEffect(() => {
    if (!Number.isInteger(numericMatchId) || numericMatchId <= 0) return;

    let active = true;
    let connection: ReturnType<typeof connectMissionSocket> | null = null;
    try {
      connection = connectMissionSocket({
        matchId: numericMatchId,
        onMission: (nextProgress) => {
          if (active && nextProgress.matchId === numericMatchId) {
            setProgress(nextProgress);
          }
        },
      });
    } catch {
      // REST로 불러온 상태는 그대로 보여주고 다음 진입 때 다시 연결한다.
    }

    return () => {
      active = false;
      if (connection) void connection.disconnect();
    };
  }, [numericMatchId]);

  if (isLoading || error || !progress || !match) {
    return (
      <PhoneFrame>
        <MissionHeader onBack={() => router.back()} />
        <div
          role={error ? "alert" : undefined}
          className={`flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm ${
            error ? "text-(--color-danger)" : "text-(--color-text-sub)"
          }`}
        >
          <span>{error ?? "미션 진행 상황을 불러오는 중..."}</span>
          {error ? (
            <Button size="sm" variant="outline" onClick={() => void loadMission()}>
              다시 시도
            </Button>
          ) : null}
        </div>
      </PhoneFrame>
    );
  }

  const missionSteps = createMissionSteps(progress);
  const lastCompletedStep = missionSteps.filter((mission) => mission.status === "done").length;
  const allCompleted = progress.currentStep >= 4;

  return (
    <PhoneFrame>
      <MissionHeader onBack={() => router.back()} />

      <main className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs text-(--color-text-sub)">{match.partner.nickname}님과 함께</p>
            {allCompleted ? (
              <>
                <p className="mt-1 text-lg font-bold text-(--color-text-strong)">
                  <span className="text-(--color-success)">모든 미션</span> 완료!
                </p>
                <p className="mt-0.5 text-sm text-(--color-text-sub)">최종 선물을 받아보세요.</p>
              </>
            ) : lastCompletedStep > 0 ? (
              <>
                <p className="mt-1 text-lg font-bold text-(--color-text-strong)">
                  <span className="text-(--color-primary)">STEP {lastCompletedStep}</span> 완료!
                </p>
                <p className="mt-0.5 text-sm text-(--color-text-sub)">다음 미션도 함께 도전해보세요.</p>
              </>
            ) : (
              <>
                <p className="mt-1 text-lg font-bold text-(--color-text-strong)">첫 미션을 시작해보세요!</p>
                <p className="mt-0.5 text-sm text-(--color-text-sub)">현장 부스에서 인증하면 다음 STEP이 열려요.</p>
              </>
            )}
          </div>

          <MissionStatusCard progress={progress} />

          <StepIndicator currentStep={progress.currentStep} />

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
              <span className="text-xs text-(--color-text-sub)">
                {allCompleted ? "모든 STEP을 완료했어요" : "STEP 3까지 완료하면"}
              </span>
              <span className="text-sm font-bold text-(--color-text-strong)">
                {allCompleted ? "부스에서 최종 선물을 받아보세요" : "최종 선물을 받을 수 있어요"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </PhoneFrame>
  );
}

function MissionHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-(--color-border) bg-(--color-surface) px-3">
      <button type="button" aria-label="뒤로가기" className="p-1" onClick={onBack}>
        <ChevronLeft className="h-5 w-5 text-(--color-text-strong)" />
      </button>
      <h1 className="flex-1 text-center text-base font-bold text-(--color-text-strong)">미션</h1>
      <span className="w-7" aria-hidden="true" />
    </header>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center px-2">
      {[1, 2, 3].map((step, index) => {
        const isDone = step < currentStep;
        const isCurrent = step === currentStep;
        const isLast = index === 2;

        let nodeClassName = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold";
        if (isDone) {
          nodeClassName += " bg-(--color-success) text-(--color-text-on-primary)";
        } else if (isCurrent) {
          nodeClassName += " bg-(--color-primary) text-(--color-text-on-primary)";
        } else {
          nodeClassName += " border-2 border-(--color-border) text-(--color-text-muted)";
        }

        const lineClassName = `h-0.5 flex-1 ${step < currentStep ? "bg-(--color-success)" : "bg-(--color-border)"}`;

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

function createMissionSteps(progress: MissionProgressResponse): MissionStep[] {
  const completedAt = [
    progress.step1CompletedAt,
    progress.step2CompletedAt,
    progress.step3CompletedAt,
  ];

  return [1, 2, 3].map((step, index) => {
    const completed = completedAt[index];
    const status: StepStatus =
      completed || step < progress.currentStep
        ? "done"
        : step === progress.currentStep
          ? "progress"
          : "locked";

    return {
      step,
      status,
      title:
        status === "progress" && progress.currentMission?.step === step
          ? progress.currentMission.title
          : `STEP ${step} 미션`,
      description:
        status === "locked"
          ? `STEP ${step - 1}를 완료하면 열려요`
          : status === "done"
            ? "부스에서 인증을 완료했어요."
            : progress.currentMission?.step === step &&
                progress.currentMission.description
              ? progress.currentMission.description
              : "현재 랜덤 미션을 함께 수행하고 부스에서 인증받으세요.",
      meta: completed
        ? `STEP ${step} 미션 완료 · ${formatCompletedAt(completed)}`
        : undefined,
    };
  });
}

function formatCompletedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "완료 시각 확인 불가";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
