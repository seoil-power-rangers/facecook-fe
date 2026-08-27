"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Search, User } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { ChipGroup } from "@ui/공통/ChipGroup";
import { StepHeader, Accent } from "@ui/공통/StepHeader";
import { TextField } from "@ui/공통/TextField";
import { Textarea } from "@ui/공통/Textarea";
import { GRADES } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

const BIO_MAX = 100;
const IDEAL_MAX = 50;

/**
 * 06 선택 (STEP 5)
 *
 * 시안에는 "전부 선택"이라고 적혀 있지만, 기능명세서 PROF-01이 이상형을 필수로
 * 정해두어 이상형만 필수로 받는다(명세서 우선 규칙).
 */
export function ProfileOptionalScreen() {
  const router = useRouter();
  const { draft, set } = useOnboarding();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState("");

  const canSubmit = draft.idealType.trim().length > 0;

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        step={5}
        title={
          <>
            조금 더 <Accent>알려주실래요?</Accent>
          </>
        }
        note="이상형만 필수예요. 나머지는 나중에 마이페이지에서 바꿀 수 있어요."
      />

      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative h-24 w-24 rounded-(--radius-full) bg-(--color-surface-alt)"
        >
          {photo ? (
            // 미리보기는 브라우저 안에서만 쓴다 — 업로드는 서버 붙은 뒤.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="프로필 미리보기"
              className="h-full w-full rounded-(--radius-full) object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-(--color-border-strong)">
              <User className="h-12 w-12" />
            </span>
          )}
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-(--radius-full) border-2 border-(--color-surface) bg-(--color-primary) text-(--color-text-on-primary)">
            <Camera className="h-4 w-4" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              setPhoto(URL.createObjectURL(file));
            }
          }}
        />
        <p className="mt-2.5 text-[12px] text-(--color-text-sub)">
          사진을 올리면 프로필이 더 눈에 띄어요
        </p>
      </div>

      <div className="mt-7 space-y-5">
        <TextField
          label="학과선택"
          placeholder="컴퓨터공학과"
          value={draft.department}
          onChange={(event) => set("department", event.target.value)}
          trailing={
            <Search className="h-5 w-5 shrink-0 text-(--color-text-muted)" />
          }
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
        <Button
          fullWidth
          disabled={!canSubmit}
          onClick={() => router.push("/onboarding/done")}
        >
          완료하고 시작
        </Button>
      </div>
    </div>
  );
}
