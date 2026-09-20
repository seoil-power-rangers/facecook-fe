"use client";

import { useRouter } from "next/navigation";
import { Button } from "@ui/공통/Button";
import { ChipGroup } from "@ui/공통/ChipGroup";
import { InfoBox } from "@ui/공통/InfoBox";
import { RadioCard } from "@ui/공통/RadioCard";
import { StepFooter } from "@ui/공통/StepFooter";
import { StepHeader, Accent } from "@ui/공통/StepHeader";
import { TextField } from "@ui/공통/TextField";
import { BLOOD_TYPES, GENDERS, MIN_AGE } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

/** 03 기본정보 (STEP 2) — 닉네임·성별·나이·혈액형. 모두 필수. */
export function ProfileBasicScreen() {
  const router = useRouter();
  const { draft, set } = useOnboarding();

  const age = Number(draft.age);
  const ageFilled = draft.age.trim().length > 0 && Number.isFinite(age);
  /*
   * 참가 하한은 탐색 필터의 눈금과 같은 값을 쓴다(공통/constants.ts). 여기만
   * 낮춰두면 가입은 되는데 탐색에서는 안 보이는 사람이 생긴다.
   *
   * 서버도 같이 막아야 우회가 안 된다 — 이 검증은 잘못 적은 사람에게 알려주는
   * 몫이지, 막는 몫이 아니다.
   */
  const ageAllowed = ageFilled && age >= MIN_AGE;
  const canSubmit =
    draft.nickname.trim().length > 0 &&
    draft.gender !== "" &&
    ageAllowed &&
    draft.bloodType !== "";

  /** 아직 안 채운 것 중 맨 위 것 하나만 말한다 — 전부 나열하면 읽지 않는다. */
  const missing = !draft.nickname.trim()
    ? "닉네임을 입력해주세요"
    : !draft.gender
      ? "성별을 골라주세요"
      : !ageFilled
        ? "나이를 입력해주세요"
        : !ageAllowed
          ? `${MIN_AGE}세부터 참여할 수 있어요`
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
            placeholder={String(MIN_AGE + 5)}
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
