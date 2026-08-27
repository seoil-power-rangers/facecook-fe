"use client";

import { useRouter } from "next/navigation";
import { Button } from "@ui/공통/Button";
import { CheckRow } from "@ui/공통/CheckRow";
import { StepHeader, Accent } from "@ui/공통/StepHeader";
import {
  MBTI_AXES,
  MBTI_NICKNAMES,
  TRAITS,
  TRAIT_MAX,
} from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

/** 04 선택 (STEP 3) — MBTI 4축 + 성향 태그 최대 2개 */
export function ProfileMbtiScreen() {
  const router = useRouter();
  const { draft, update } = useOnboarding();

  const slots = MBTI_AXES.map((_, index) => draft.mbti[index] ?? "");
  const done = slots.every(Boolean);
  const mbti = done ? slots.join("") : "";

  const pick = (axis: number, code: string) =>
    update((prev) => {
      const next = MBTI_AXES.map((_, index) => prev.mbti[index] ?? "");
      next[axis] = next[axis] === code ? "" : code;
      return { ...prev, mbti: next };
    });

  const toggleTrait = (trait: string) =>
    update((prev) => {
      const on = prev.traits.includes(trait);
      if (!on && prev.traits.length >= TRAIT_MAX) {
        return prev;
      }
      return {
        ...prev,
        traits: on
          ? prev.traits.filter((value) => value !== trait)
          : [...prev.traits, trait],
      };
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
      />

      <div className="grid grid-cols-4 gap-2.5">
        {MBTI_AXES.map((axis, index) => (
          <MbtiCell
            key={axis.top.code}
            option={axis.top}
            selected={slots[index] === axis.top.code}
            onSelect={() => pick(index, axis.top.code)}
          />
        ))}
        {MBTI_AXES.map((axis, index) => (
          <MbtiCell
            key={axis.bottom.code}
            option={axis.bottom}
            selected={slots[index] === axis.bottom.code}
            onSelect={() => pick(index, axis.bottom.code)}
          />
        ))}
      </div>

      {done ? (
        <div className="mt-5 rounded-(--radius-md) bg-(--color-primary-light) px-4 py-3">
          <p className="text-[11px] font-bold text-(--color-text-sub)">
            내 MBTI
          </p>
          <p className="mt-0.5 text-[15px] font-bold text-(--color-primary)">
            {mbti} · {MBTI_NICKNAMES[mbti] ?? "나만의 유형"}
          </p>
        </div>
      ) : null}

      <div className="mt-7">
        <h2 className="text-[17px] font-bold text-(--color-text-strong)">
          나를 한마디로 <Accent>표현하면?</Accent>
        </h2>
        <p className="mt-1 text-[12px] text-(--color-text-sub)">
          최대 {TRAIT_MAX}개까지 고를 수 있어요
        </p>

        <div className="mt-3 space-y-2">
          {TRAITS.map((trait) => {
            const on = draft.traits.includes(trait);
            return (
              <CheckRow
                key={trait}
                filled
                label={trait}
                checked={on}
                disabled={!on && draft.traits.length >= TRAIT_MAX}
                onToggle={() => toggleTrait(trait)}
              >
                {trait}
              </CheckRow>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Button
          fullWidth
          disabled={!done}
          onClick={() => router.push("/onboarding/hobby")}
        >
          다음으로
        </Button>
      </div>
    </div>
  );
}

interface MbtiCellProps {
  option: { code: string; label: string };
  selected: boolean;
  onSelect: () => void;
}

function MbtiCell({ option, selected, onSelect }: MbtiCellProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${option.code} ${option.label}`}
      onClick={onSelect}
      className={`flex flex-col items-center gap-0.5 rounded-(--radius-md) py-3 transition-colors ${
        selected
          ? "bg-(--color-primary) text-(--color-text-on-primary)"
          : "bg-(--color-surface-alt) text-(--color-text-sub)"
      }`}
    >
      <span className="text-[20px] font-bold leading-none">{option.code}</span>
      <span className="text-[10px]">{option.label}</span>
    </button>
  );
}
