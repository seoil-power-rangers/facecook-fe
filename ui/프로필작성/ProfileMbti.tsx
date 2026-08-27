"use client";

import { useRouter } from "next/navigation";
import Button from "@ui/공통/Button";
import CheckRow from "@ui/공통/CheckRow";
import StepHeader, { Accent } from "@ui/공통/StepHeader";
import {
  MBTI_AXES,
  MBTI_NICKNAMES,
  TRAITS,
  TRAIT_MAX,
} from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

/** 05-profile-mbti (STEP 4) — MBTI 4축 + 성향 태그 최대 2개 */
export default function ProfileMbti() {
  const router = useRouter();
  const { draft, update } = useOnboarding();

  const slots = MBTI_AXES.map((_, i) => draft.mbti[i] ?? "");
  const done = slots.every(Boolean);
  const mbti = done ? slots.join("") : "";

  const pick = (axis: number, code: string) =>
    update((d) => {
      const next = MBTI_AXES.map((_, i) => d.mbti[i] ?? "");
      next[axis] = next[axis] === code ? "" : code;
      return { ...d, mbti: next };
    });

  const toggleTrait = (t: string) =>
    update((d) => {
      const on = d.traits.includes(t);
      if (!on && d.traits.length >= TRAIT_MAX) return d;
      return {
        ...d,
        traits: on ? d.traits.filter((v) => v !== t) : [...d.traits, t],
      };
    });

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        step={4}
        title={
          <>
            <Accent>MBTI</Accent>가 어떻게 되세요?
          </>
        }
      />

      <div className="grid grid-cols-4 gap-2.5">
        {MBTI_AXES.map((axis, i) => (
          <MbtiCell
            key={axis.top.code}
            option={axis.top}
            on={slots[i] === axis.top.code}
            onClick={() => pick(i, axis.top.code)}
          />
        ))}
        {MBTI_AXES.map((axis, i) => (
          <MbtiCell
            key={axis.bottom.code}
            option={axis.bottom}
            on={slots[i] === axis.bottom.code}
            onClick={() => pick(i, axis.bottom.code)}
          />
        ))}
      </div>

      {done && (
        <div className="mt-5 rounded-xl bg-primary-soft px-4 py-3">
          <p className="text-[11px] font-bold text-muted">내 MBTI</p>
          <p className="mt-0.5 text-[15px] font-bold text-primary">
            {mbti} · {MBTI_NICKNAMES[mbti] ?? "나만의 유형"}
          </p>
        </div>
      )}

      <div className="mt-7">
        <h2 className="text-[17px] font-bold">
          나를 한마디로 <Accent>표현하면?</Accent>
        </h2>
        <p className="mt-1 text-[12px] text-muted">
          최대 {TRAIT_MAX}개까지 고를 수 있어요
        </p>

        <div className="mt-3 space-y-2">
          {TRAITS.map((t) => {
            const on = draft.traits.includes(t);
            return (
              <CheckRow
                key={t}
                filled
                label={t}
                checked={on}
                disabled={!on && draft.traits.length >= TRAIT_MAX}
                onToggle={() => toggleTrait(t)}
              >
                {t}
              </CheckRow>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Button
          disabled={!done}
          onClick={() => router.push("/onboarding/hobby")}
        >
          다음으로
        </Button>
      </div>
    </div>
  );
}

function MbtiCell({
  option,
  on,
  onClick,
}: {
  option: { code: string; label: string };
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${option.code} ${option.label}`}
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 rounded-xl py-3 transition-colors ${
        on ? "bg-primary text-white" : "bg-surface text-muted"
      }`}
    >
      <span className="text-[20px] font-bold leading-none">{option.code}</span>
      <span className="text-[10px]">{option.label}</span>
    </button>
  );
}
