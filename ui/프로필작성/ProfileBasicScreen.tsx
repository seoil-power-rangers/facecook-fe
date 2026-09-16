"use client";

import { useRouter } from "next/navigation";
import { Button } from "@ui/공통/Button";
import { ChipGroup } from "@ui/공통/ChipGroup";
import { InfoBox } from "@ui/공통/InfoBox";
import { RadioCard } from "@ui/공통/RadioCard";
import { StepFooter } from "@ui/공통/StepFooter";
import { StepHeader, Accent } from "@ui/공통/StepHeader";
import { TextField } from "@ui/공통/TextField";
import { BLOOD_TYPES, GENDERS } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

/** 03 기본정보 (STEP 2) — 닉네임·성별·나이·혈액형. 모두 필수. */
export function ProfileBasicScreen() {
  const router = useRouter();
  const { draft, set } = useOnboarding();

  const age = Number(draft.age);
  const ageFilled = Number.isFinite(age) && age > 0;
  const canSubmit =
    draft.nickname.trim().length > 0 &&
    draft.gender !== "" &&
    ageFilled &&
    draft.bloodType !== "";

  /** 아직 안 채운 것 중 맨 위 것 하나만 말한다 — 전부 나열하면 읽지 않는다. */
  const missing = !draft.nickname.trim()
    ? "닉네임을 입력해주세요"
    : !draft.gender
      ? "성별을 골라주세요"
      : !ageFilled
        ? "나이를 입력해주세요"
        : !draft.bloodType
          ? "혈액형을 골라주세요"
          : undefined;

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        step={2}
        title={
          <>
            <Accent>기본 정보</Accent>를 알려주세요
          </>
        }
        note="등록 후에는 바꿀 수 없어요."
        noteTone="warning"
      />

      <div className="space-y-5">
        <TextField
          label="닉네임 또는 이름"
          maxLength={20}
          placeholder="지호"
          value={draft.nickname}
          onChange={(event) => set("nickname", event.target.value)}
        />

        <RadioCard
          label="성별"
          options={GENDERS}
          value={draft.gender}
          onChange={(value) => set("gender", value)}
        />

        <div className="w-1/2 pr-1.5">
          <TextField
            label="나이"
            inputMode="numeric"
            maxLength={2}
            suffix="세"
            placeholder="24"
            value={draft.age}
            onChange={(event) =>
              set("age", event.target.value.replace(/\D/g, ""))
            }
          />
        </div>

        <ChipGroup
          label="혈액형"
          options={BLOOD_TYPES}
          value={draft.bloodType}
          onChange={(value) => set("bloodType", value)}
        />

        <InfoBox>필수 항목은 등록 후 수정할 수 없어요.</InfoBox>
      </div>

      <StepFooter hint={missing}>
        <Button
          fullWidth
          disabled={!canSubmit}
          onClick={() => router.push("/onboarding/mbti")}
        >
          다음으로
        </Button>
      </StepFooter>
    </div>
  );
}
