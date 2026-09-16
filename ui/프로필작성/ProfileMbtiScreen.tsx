"use client";

import { useRouter } from "next/navigation";
import { Button } from "@ui/공통/Button";
import { StepFooter } from "@ui/공통/StepFooter";
import { StepHeader, Accent } from "@ui/공통/StepHeader";
import { MBTI_AXES, MBTI_NICKNAMES } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

/** 04 선택 (STEP 3) — MBTI 4축 */
export function ProfileMbtiScreen() {
  const router = useRouter();
  const { draft, update } = useOnboarding();

  const slots = MBTI_AXES.map((_, index) => draft.mbti[index] ?? "");
  const done = slots.every(Boolean);
  const mbti = done ? slots.join("") : "";
  const remaining = slots.filter((slot) => !slot).length;

  const pick = (axis: number, code: string) =>
    update((prev) => {
      const next = MBTI_AXES.map((_, index) => prev.mbti[index] ?? "");
      next[axis] = next[axis] === code ? "" : code;
      return { ...prev, mbti: next };
    });

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        step={3}
        title={
          <>
            <Accent>MBTI</Accent>가 어떻게 되세요?
          </>
        }
        note="축마다 하나씩 골라주세요"
      />

      {/*
        네 글자가 들어갈 자리를 먼저 비워둔다. 고르기 전에는 화면에 아무 변화가
        없어서 다 채우기 전까지 진행이 안 보이고 아래가 비어 보였다.

        상자를 두르지 않고 글자만 세운다 — 아래 축 토글이 이미 알약이라,
        위도 둥근 사각형이면 같은 모양이 두 벌 겹쳐서 어느 쪽이 결과고 어느
        쪽이 고르는 곳인지 흐려진다.
      */}
      <div className="mb-6">
        <div className="flex justify-center gap-3.5">
          {MBTI_AXES.map((axis, index) => {
            const code = slots[index];

            return (
              <div key={axis.top.code} className="w-[46px] text-center">
                <p
                  className={`text-[30px] font-bold leading-tight ${
                    code ? "text-(--color-primary)" : "text-(--color-border)"
                  }`}
                >
                  {code || "—"}
                </p>
                <div
                  className={`mt-1.5 h-[3px] rounded-(--radius-full) ${
                    code ? "bg-(--color-primary)" : "bg-(--color-border)"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* 네 칸이 다 차면 바로 아래에 이름이 붙는다 — 고른 결과가 뭔지 알려주는 보상. */}
        {done ? (
          <p className="mt-3 text-center text-[13px] font-bold text-(--color-primary)">
            {MBTI_NICKNAMES[mbti] ?? "나만의 유형"}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {MBTI_AXES.map((axis, index) => (
          <MbtiAxis
            key={axis.top.code}
            axis={axis}
            picked={slots[index]}
            onPick={(code) => pick(index, code)}
          />
        ))}
      </div>

      <StepFooter
        hint={done ? undefined : `${remaining}개 축만 더 골라주세요`}
      >
        <Button
          fullWidth
          disabled={!done}
          onClick={() => router.push("/onboarding/hobby")}
        >
          다음으로
        </Button>
      </StepFooter>
    </div>
  );
}

interface MbtiAxisProps {
  axis: (typeof MBTI_AXES)[number];
  picked: string;
  onPick: (code: string) => void;
}

/**
 * 한 축을 좌우로 가른 토글.
 *
 * 8칸을 2행 그리드로 깔면 "축"이라는 정보가 사라져서, 축마다 하나씩 골라야
 * 한다는 규칙을 문구로 따로 설명해야 한다. 양쪽이 한 알약 안에 붙어 있으면
 * 형태만으로 그 규칙이 보인다.
 */
function MbtiAxis({ axis, picked, onPick }: MbtiAxisProps) {
  return (
    <div className="flex rounded-(--radius-full) border border-(--color-border) bg-(--color-surface-alt) p-1">
      {[axis.top, axis.bottom].map((option) => {
        const selected = picked === option.code;

        return (
          <button
            key={option.code}
            type="button"
            aria-pressed={selected}
            aria-label={`${option.code} ${option.label}`}
            onClick={() => onPick(option.code)}
            /*
             * 고른 쪽을 보라로 채우면 위 결과 글자까지 여덟 군데가 전부 보라가
             * 돼서 볼 곳이 없어진다. 흰 알약으로 떠오르게만 하고 색은 위에 남긴다.
             */
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-(--radius-full) py-2 transition-colors ${
              selected
                ? "bg-(--color-surface) text-(--color-primary) shadow-sm"
                : "text-(--color-text-sub)"
            }`}
          >
            <span className="text-[17px] font-bold leading-none">
              {option.code}
            </span>
            <span className="text-[10px]">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
