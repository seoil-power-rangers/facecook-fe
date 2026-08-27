"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@ui/공통/Button";
import TextField from "@ui/공통/TextField";
import Textarea from "@ui/공통/Textarea";
import ChipGroup from "@ui/공통/ChipGroup";
import StepHeader, { Accent } from "@ui/공통/StepHeader";
import { CameraIcon, PersonIcon, SearchIcon } from "@ui/공통/icons";
import { GRADES } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

const BIO_MAX = 100;
const IDEAL_MAX = 50;

/**
 * 07-profile-optional (STEP 6)
 *
 * 시안에는 "전부 선택"이라고 적혀 있지만, 기능명세서 PROF-01이 이상형을 필수로
 * 정해두어 이상형만 필수로 받는다(명세서 우선 규칙).
 */
export default function ProfileOptional() {
  const router = useRouter();
  const { draft, set, reset } = useOnboarding();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState("");

  const canSubmit = draft.idealType.trim().length > 0;

  const finish = () => {
    // 서버가 붙으면 여기서 User + Profile 생성을 호출한다.
    reset();
    router.push("/main");
  };

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        step={6}
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
          className="relative h-24 w-24 rounded-full bg-surface"
        >
          {photo ? (
            // 미리보기는 브라우저 안에서만 쓴다 — 업로드는 서버 붙은 뒤.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="프로필 미리보기"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center p-6 text-line">
              <PersonIcon />
            </span>
          )}
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary p-1.5 text-white">
            <CameraIcon />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPhoto(URL.createObjectURL(f));
          }}
        />
        <p className="mt-2.5 text-[12px] text-muted">
          사진을 올리면 프로필이 더 눈에 띄어요
        </p>
      </div>

      <div className="mt-7 space-y-5">
        <TextField
          label="학과선택"
          placeholder="컴퓨터공학과"
          value={draft.department}
          onChange={(e) => set("department", e.target.value)}
          trailing={
            <span className="h-5 w-5 shrink-0 text-muted">
              <SearchIcon />
            </span>
          }
        />

        <ChipGroup
          label="학년선택"
          options={GRADES}
          value={draft.grade}
          onChange={(v) => set("grade", v)}
        />

        <Textarea
          label="자기소개"
          hint="선택"
          rows={3}
          maxLength={BIO_MAX}
          placeholder="주말엔 주로 밀장 가거나 필름카메라 들고 산책해요."
          value={draft.bio}
          onChange={(e) => set("bio", e.target.value)}
        />

        <Textarea
          label="이상형"
          rows={2}
          maxLength={IDEAL_MAX}
          placeholder="대화가 잘 통하는 사람"
          value={draft.idealType}
          onChange={(e) => set("idealType", e.target.value)}
        />
      </div>

      <div className="mt-auto pt-8">
        <Button disabled={!canSubmit} onClick={finish}>
          완료하고 시작
        </Button>
      </div>
    </div>
  );
}
