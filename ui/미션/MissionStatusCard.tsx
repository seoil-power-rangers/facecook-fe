import Link from "next/link";
import { Check, Gift } from "lucide-react";
import type { MissionProgressResponse } from "./missionModel";

export function MissionStatusCard({
  progress,
  href,
  compact = false,
}: {
  progress: MissionProgressResponse;
  href?: string;
  compact?: boolean;
}) {
  const completed = progress.currentStep > 3;
  const content = (
    <div
      className={`flex items-start gap-3 rounded-(--radius-lg) ${
        completed
          ? "bg-(--color-success)/10"
          : "bg-(--color-primary-lighter)"
      } ${compact ? "p-3" : "p-4"}`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-surface) ${
          completed ? "text-(--color-success)" : "text-(--color-primary)"
        }`}
      >
        {completed ? <Check className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-(--color-text-sub)">
          {completed ? "MISSION COMPLETE" : `현재 STEP ${progress.currentStep} 랜덤 미션`}
        </p>
        <p className="mt-0.5 text-sm font-bold text-(--color-text-strong)">
          {completed
            ? "모든 미션 클리어"
            : progress.currentMission?.title ?? "미션을 확인하고 함께 도전해보세요"}
        </p>
        {!completed && progress.currentMission?.description ? (
          <p className="mt-1 text-xs leading-relaxed text-(--color-text-sub)">
            {progress.currentMission.description}
          </p>
        ) : null}
        {completed ? (
          <p className="mt-1 text-xs text-(--color-text-sub)">
            부스에서 최종 선물을 받아보세요.
          </p>
        ) : null}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} aria-label="미션 상세 보기" className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
