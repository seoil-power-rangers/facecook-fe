"use client";

import { useRouter } from "next/navigation";
import Button from "@ui/공통/Button";
import TextField from "@ui/공통/TextField";
import RadioCard from "@ui/공통/RadioCard";
import ChipGroup from "@ui/공통/ChipGroup";
import StepHeader, { Accent } from "@ui/공통/StepHeader";
import InfoBox from "@ui/공통/InfoBox";
import { BLOOD_TYPES, GENDERS } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

/** 04-profile-basic (STEP 3) — 닉네임·성별·나이·혈액형. 모두 필수. */
export default function ProfileBasic() {
  const router = useRouter();
  const { draft, set } = useOnboarding();

  const age = Number(draft.age);
  const canSubmit =
    draft.nickname.trim().length > 0 &&
    draft.gender !== "" &&
    Number.isFinite(age) &&
    age > 0 &&
    draft.bloodType !== "";

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        step={3}
        title={
          <>
            <Accent>기본 정보</Accent>를 알려주세요
          </>
        }
        note="등록 후에는 바꿀 수 없어요."
        noteTone="warn"
      />

      <div className="space-y-5">
        <TextField
          label="닉네임 또는 이름"
          maxLength={20}
          placeholder="지호"
          value={draft.nickname}
          onChange={(e) => set("nickname", e.target.value)}
        />

        <RadioCard
          label="성별"
          options={GENDERS}
          value={draft.gender}
          onChange={(v) => set("gender", v)}
        />

        <div className="w-1/2 pr-1.5">
          <TextField
            label="나이"
            inputMode="numeric"
            maxLength={2}
            suffix="세"
            placeholder="24"
            value={draft.age}
            onChange={(e) => set("age", e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <ChipGroup
          label="혈액형"
          options={BLOOD_TYPES}
          value={draft.bloodType}
          onChange={(v) => set("bloodType", v)}
        />

        <InfoBox>필수 항목은 등록 후 수정할 수 없어요.</InfoBox>
      </div>

      <div className="mt-auto pt-8">
        <Button
          disabled={!canSubmit}
          onClick={() => router.push("/onboarding/mbti")}
        >
          다음으로
        </Button>
      </div>
    </div>
  );
}
