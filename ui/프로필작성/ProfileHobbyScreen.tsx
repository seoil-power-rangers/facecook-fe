"use client";

import { useRouter } from "next/navigation";
import { Button } from "@ui/공통/Button";
import { StepHeader, Accent } from "@ui/공통/StepHeader";
import { TileGrid } from "@ui/공통/TileGrid";
import { ACTIVITIES, ACTIVITY_MIN } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

/** 05 선택 (STEP 4) — 12종 중 3개 이상 */
export function ProfileHobbyScreen() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const picked = draft.activities.length;

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        step={4}
        title={
          <>
            <Accent>이런 걸</Accent> 하고 싶어요
          </>
        }
        note={`만난다면 하고 싶은 활동을 골라주세요 (${ACTIVITY_MIN}개 이상)`}
      />

      <TileGrid
        options={ACTIVITIES}
        value={draft.activities}
        onToggle={(option) =>
          update((prev) => ({
            ...prev,
            activities: prev.activities.includes(option)
              ? prev.activities.filter((value) => value !== option)
              : [...prev.activities, option],
          }))
        }
      />

      <div className="mt-auto pt-8">
        {picked > 0 && picked < ACTIVITY_MIN ? (
          <p className="mb-2 text-center text-[12px] text-(--color-text-sub)">
            {ACTIVITY_MIN - picked}개만 더 골라주세요
          </p>
        ) : null}
        <Button
          fullWidth
          disabled={picked < ACTIVITY_MIN}
          onClick={() => router.push("/onboarding/optional")}
        >
          다음으로
        </Button>
      </div>
    </div>
  );
}
