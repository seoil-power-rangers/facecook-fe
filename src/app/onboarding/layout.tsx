"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { ProgressBar } from "@ui/공통/ProgressBar";
import { getMyProfile } from "@ui/프로필작성/profileApi";

/** 주소 → 시안의 STEP 번호. 약관을 02 인증에 합쳐 5단계다. */
const STEPS: Record<string, number> = {
  "/onboarding/email": 1,
  "/onboarding/basic": 2,
  "/onboarding/mbti": 3,
  "/onboarding/hobby": 4,
  "/onboarding/optional": 5,
};

/**
 * 02(이메일 인증) 이후 단계는 계정은 있고 프로필만 없는 상태를 전제로
 * 한다. 온보딩을 이미 끝낸 사람이 뒤로가기 등으로 다시 들어오면 값을
 * 만지다가 제출해서야 409(PROFILE_ALREADY_EXISTS)로 알게 되므로, 화면에
 * 들어오는 시점에 먼저 확인해서 /main으로 돌려보낸다.
 *
 * 02(이메일 인증) 자체는 제외한다 — 계정을 만들기 전이라 세션이 아직
 * 없고, 여기서 getMyProfile()을 부르면 401을 세션 만료로 오인해
 * 로그인 화면으로 튕겨나간다(신규 가입자에게는 로그인 계정 자체가 없다).
 */
const STEPS_AFTER_SIGNUP = new Set(["/onboarding/basic", "/onboarding/mbti", "/onboarding/hobby", "/onboarding/optional"]);

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const step = STEPS[pathname];

  useEffect(() => {
    if (!STEPS_AFTER_SIGNUP.has(pathname)) return;
    let active = true;

    getMyProfile()
      .then(() => {
        if (active) router.replace("/main");
      })
      .catch(() => {
        // PROFILE_NOT_FOUND면 아직 온보딩 중이라는 뜻이라 정상이다.
        // 세션 만료(401)는 profileApi가 이미 로그인 화면으로 보낸다.
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

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
