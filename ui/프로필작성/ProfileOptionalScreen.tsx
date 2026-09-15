"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarPhotoPicker } from "@ui/공통/AvatarPhotoPicker";
import { Button } from "@ui/공통/Button";
import { ChipGroup } from "@ui/공통/ChipGroup";
import { DepartmentPicker } from "@ui/공통/DepartmentPicker";
import { StepHeader, Accent } from "@ui/공통/StepHeader";
import { Textarea } from "@ui/공통/Textarea";
import { BIO_MAX, GRADES } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";
import {
  createProfile,
  createProfileRequestFromDraft,
  profileErrorMessage,
} from "./profileApi";

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
      await createProfile(createProfileRequestFromDraft(draft));
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
          label="학과선택"
          value={draft.department}
          onChange={(value) => set("department", value)}
        />

        <ChipGroup
          label="학년선택"
          options={GRADES}
          value={draft.grade}
          onChange={(value) => set("grade", value)}
        />

        <Textarea
          label="자기소개"
          hint="선택"
          rows={3}
          maxLength={BIO_MAX}
          placeholder="주말엔 주로 밀장 가거나 필름카메라 들고 산책해요."
          value={draft.bio}
          onChange={(event) => set("bio", event.target.value)}
        />
      </div>

      <div className="mt-auto pt-8">
        {error ? (
          <p
            role="alert"
            className="mb-2 text-center text-[12px] text-(--color-danger)"
          >
            {error}
          </p>
        ) : null}
        <Button
          fullWidth
          disabled={isSubmitting}
          onClick={submit}
        >
          {isSubmitting ? "등록 중..." : "완료하고 시작"}
        </Button>
      </div>
    </div>
  );
}
