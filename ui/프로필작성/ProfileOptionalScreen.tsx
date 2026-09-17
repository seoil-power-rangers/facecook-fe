"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarPhotoPicker } from "@ui/공통/AvatarPhotoPicker";
import { Button } from "@ui/공통/Button";
import { ChipGroup } from "@ui/공통/ChipGroup";
import { DepartmentPicker } from "@ui/공통/DepartmentPicker";
import { StepFooter } from "@ui/공통/StepFooter";
import { StepHeader, Accent } from "@ui/공통/StepHeader";
import { Textarea } from "@ui/공통/Textarea";
import { BIO_MAX, GRADES } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";
import {
  createProfile,
  createProfileRequestFromDraft,
  profileErrorMessage,
} from "./profileApi";
import { identifyUser, track } from "@ui/공통/analytics";

/**
 * 06 선택 (STEP 5)
 *
 * 명세서 PROF-02의 선택 항목만 모아둔 화면. 필수인 이상형은 STEP 4로 옮겼다.
 */
export function ProfileOptionalScreen() {
  const router = useRouter();
  const { draft, set } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const submit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const profile = await createProfile(createProfileRequestFromDraft(draft));
      /*
       * 가입은 여기서 끝난다. 로그인 화면에서만 identify하면 부스 참가자
       * 대부분이 3일 내내 익명으로 남는다 — 한 번 가입하면 세션 쿠키가
       * 유지돼서 다시 로그인할 일이 없기 때문이다. 그러면 가입 → 콕 →
       * 매칭이라는 핵심 퍼널이 신규 가입자에게서 끊긴다.
       */
      identifyUser(profile.userId, "participant");
      track({ name: "onboarding_completed" });
      router.push("/onboarding/done");
    } catch (submitError) {
      setError(profileErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        step={5}
        title={
          <>
            조금 더 <Accent>알려주실래요?</Accent>
          </>
        }
        note={
          <>
            <span className="font-bold text-(--color-warning)">전부 선택</span>이에요.
            나중에 마이페이지에서도 채울 수 있어요.
          </>
        }
      />

      <div className="flex flex-col items-center gap-2">
        <AvatarPhotoPicker
          name={draft.nickname}
          photoUrl={draft.photoUrl || null}
          gender={draft.gender}
          onChange={(url) => {
            setPhotoError(null);
            set("photoUrl", url ?? "");
          }}
          onError={setPhotoError}
        />
        {photoError ? (
          <p role="alert" className="text-[12px] text-(--color-danger)">
            {photoError}
          </p>
        ) : null}
      </div>

      <div className="mt-5 space-y-5">
        <DepartmentPicker
          label="학과"
          value={draft.department}
          onChange={(value) => set("department", value)}
        />

        <ChipGroup
          label="학년"
          options={GRADES}
          value={draft.grade}
          onChange={(value) => set("grade", value)}
        />

        <Textarea
          label="자기소개"
          hint={`선택 · ${draft.bio.length}/${BIO_MAX}`}
          rows={3}
          maxLength={BIO_MAX}
          placeholder="주말엔 주로 밀장 가거나 필름카메라 들고 산책해요."
          value={draft.bio}
          onChange={(event) => set("bio", event.target.value)}
        />
      </div>

      <StepFooter
        hint={
          error ? (
            <span role="alert" className="text-(--color-danger)">
              {error}
            </span>
          ) : undefined
        }
      >
        <Button
          fullWidth
          disabled={isSubmitting}
          onClick={submit}
        >
          {isSubmitting ? "등록 중..." : "완료하고 시작"}
        </Button>
      </StepFooter>
    </div>
  );
}
