"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { ProgressBar } from "@ui/공통/ProgressBar";

/** 주소 → 시안의 STEP 번호. 약관을 02 인증에 합쳐 5단계다. */
const STEPS: Record<string, number> = {
  "/onboarding/email": 1,
  "/onboarding/basic": 2,
  "/onboarding/mbti": 3,
  "/onboarding/hobby": 4,
  "/onboarding/optional": 5,
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const step = STEPS[usePathname()];

  // 07 완료 화면은 단계에 없다 — 진행바도 뒤로가기도 두지 않는다.
  if (step === undefined) {
    return <PhoneFrame>{children}</PhoneFrame>;
  }

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-8 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로"
          className="-ml-1 mb-4 text-(--color-text-strong)"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <ProgressBar step={step} />

        <div className="mt-7 flex flex-1 flex-col">{children}</div>
      </div>
    </PhoneFrame>
  );
}
