"use client";

import { useRouter } from "next/navigation";
import { Button } from "@ui/공통/Button";
import { StepHeader, Accent } from "@ui/공통/StepHeader";
import { Textarea } from "@ui/공통/Textarea";
import { TileGrid } from "@ui/공통/TileGrid";
import { ACTIVITIES, ACTIVITY_MIN } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

const IDEAL_MAX = 50;

/**
 * 05 선택 (STEP 4) — 활동 12종 중 3개 이상 + 이상형
 *
 * 이상형은 명세서 PROF-01의 필수 항목이라, 선택 항목만 모아둔 STEP 5 대신
 * 필수로 끝나는 이 화면에 둔다.
 */
export function ProfileHobbyScreen() {
  const router = useRouter();
  const { draft, set, update } = useOnboarding();
  const picked = draft.activities.length;
  const canSubmit =
    picked >= ACTIVITY_MIN && draft.idealType.trim().length > 0;

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        step={4}
        title={
          <>
            <Accent>이런 만남</Accent>을 원해요
          </>
        }
        note={
          <>
            하고 싶은 활동(
            <span className="font-bold text-(--color-warning)">
              {ACTIVITY_MIN}개 이상
            </span>
            )과 만나고 싶은 사람을 알려주세요
          </>
        }
      />

      <TileGrid
        label="활동"
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

      <div className="mt-7">
        <Textarea
          label="이상형"
          rows={2}
          maxLength={IDEAL_MAX}
          placeholder="대화가 잘 통하는 사람"
          value={draft.idealType}
          onChange={(event) => set("idealType", event.target.value)}
        />
      </div>

      <div className="mt-auto pt-8">
        {picked > 0 && picked < ACTIVITY_MIN ? (
          <p className="mb-2 text-center text-[12px] text-(--color-text-sub)">
            {ACTIVITY_MIN - picked}개만 더 골라주세요
          </p>
        ) : null}
        <Button
          fullWidth
          disabled={!canSubmit}
          onClick={() => router.push("/onboarding/optional")}
        >
          다음으로
        </Button>
      </div>
    </div>
  );
}
