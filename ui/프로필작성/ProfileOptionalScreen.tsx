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

/**
 * 06 선택 (STEP 5)
 *
 * 명세서 PROF-02의 선택 항목만 모아둔 화면. 필수인 이상형은 STEP 4로 옮겼다.
 */
export function ProfileOptionalScreen() {
  const router = useRouter();
  const { draft, set } = useOnboarding();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState("");

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
            <span className="text-(--color-warning)">전부 선택</span>이에요.
            나중에 마이페이지에서도 채울 수 있어요.
          </>
        }
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
      </div>

      <div className="mt-auto pt-8">
        <Button
          fullWidth
          onClick={() => router.push("/onboarding/done")}
        >
          완료하고 시작
        </Button>
      </div>
    </div>
  );
}
