"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { getMyProfile } from "@ui/프로필작성/profileApi";
import { track, type OnboardingStep } from "@ui/공통/analytics";

/** 진행바·뒤로가기가 붙는 입력 단계. 07 완료 화면은 여기 없다. */
const STEP_ROUTES = new Set([
  "/onboarding/email",
  "/onboarding/basic",
  "/onboarding/mbti",
  "/onboarding/hobby",
  "/onboarding/optional",
]);

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

/**
 * 주소 → 로그에 남길 단계 이름. 단계별 이탈률의 재료다.
 *
 * STEP_ROUTES와 목록이 겹치지만 따로 둔다 — 저쪽은 "진행바를 그릴지"를
 * 정하는 화면 기준이고, 이쪽은 로그 이름이라 화면 구성이 바뀌어도
 * 지표의 의미가 흔들리면 안 된다.
 */
const STEP_NAMES: Record<string, OnboardingStep> = {
  "/onboarding/email": "email",
  "/onboarding/basic": "basic",
  "/onboarding/mbti": "mbti",
  "/onboarding/hobby": "hobby",
  "/onboarding/optional": "optional",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  /*
   * 온보딩 화면 다섯 개가 각자 부르는 대신 여기 한 곳에서 보낸다 — 화면이
   * 늘거나 순서가 바뀌어도 로그가 빠지지 않는다.
   */
  useEffect(() => {
    const step = STEP_NAMES[pathname];
    if (step) track({ name: "onboarding_step_viewed", props: { step } });
  }, [pathname]);

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

  // 07 완료 화면은 단계에 없다 — 자기 레이아웃을 직접 잡으므로 여백도 주지 않는다.
  if (!STEP_ROUTES.has(pathname)) {
    return <PhoneFrame>{children}</PhoneFrame>;
  }

  /*
   * 가로 여백은 여기서 한 번만 준다. 화면 끝까지 깔리는 히어로 헤더
   * (StepHeader)만 이 여백을 -mx-5로 뚫고 나간다.
   */
  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-8">
        {children}
      </div>
    </PhoneFrame>
  );
}
