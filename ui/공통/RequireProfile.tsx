"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ProfileApiError,
  getMyProfile,
  isSignedOut,
} from "@ui/프로필작성/profileApi";

const ONBOARDING_START_PATH = "/onboarding/basic";
const LOGIN_PATH = "/login";

type Status = "checking" | "ready" | "redirecting";

/**
 * 로그인은 됐지만 온보딩(프로필 작성)을 끝내지 않은 계정이 참가자 화면
 * (/main, /mypage, /kok, /match, /profile/[userId])에 들어오면 온보딩으로
 * 돌려보낸다. 로그인 화면을 거쳤는지와 무관하게(뒤로가기, 북마크 등 어떤
 * 경로로 들어와도) 화면 진입 시점에 직접 확인해야 해서 각 화면이 아니라
 * 이 공용 레이아웃 한 곳에서 처리한다.
 */
export function RequireProfile({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    getMyProfile()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ProfileApiError && error.code === "PROFILE_NOT_FOUND") {
          setStatus("redirecting");
          router.replace(ONBOARDING_START_PATH);
          return;
        }
        /*
         * 로그인이 풀렸으면 화면을 그리면 안 된다. 로그아웃한 뒤 뒤로가기로
         * 돌아오면 세션이 없는 채로 껍데기만 그려져서, 남의 폰에 이전
         * 사용자의 화면이 남는 것처럼 보인다.
         */
        if (isSignedOut(error)) {
          setStatus("redirecting");
          router.replace(LOGIN_PATH);
          return;
        }
        // 네트워크가 잠깐 끊긴 경우까지 쫓아내지는 않는다. 각 화면이 알아서
        // 오류를 보여준다.
        setStatus("ready");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status !== "ready") {
    return null;
  }

  return <>{children}</>;
}
