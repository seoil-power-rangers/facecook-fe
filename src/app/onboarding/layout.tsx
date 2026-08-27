"use client";

import { usePathname, useRouter } from "next/navigation";
import ProgressBar from "@ui/공통/ProgressBar";
import { ChevronLeft } from "@ui/공통/icons";

/** 주소 → 시안의 STEP 번호 */
const STEPS: Record<string, number> = {
  "/onboarding/email": 1,
  "/onboarding/terms": 2,
  "/onboarding/basic": 3,
  "/onboarding/mbti": 4,
  "/onboarding/hobby": 5,
  "/onboarding/optional": 6,
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const step = STEPS[usePathname()] ?? 0;

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-8 pt-4">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="뒤로"
        className="-ml-1 mb-4 h-6 w-6 text-ink"
      >
        <ChevronLeft />
      </button>

      <ProgressBar step={step} />

      <div className="mt-7 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
