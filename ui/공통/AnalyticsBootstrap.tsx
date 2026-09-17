"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, trackPageview } from "./analytics";

/**
 * 로그 수집을 앱 진입 시점에 건다. 화면은 그리지 않는다 — PwaBootstrap과 같은 역할.
 *
 * 화면 이동을 직접 기록하는 이유: App Router는 페이지를 새로 불러오지 않고
 * 클라이언트에서 갈아끼워서, 브라우저 관점에서는 첫 진입 한 번 말고는
 * 아무 일도 일어나지 않는다. PostHog의 자동 pageview를 꺼두고
 * (analytics.ts의 capture_pageview: false) 여기서 pathname이 바뀔 때마다 보낸다.
 *
 * useSearchParams가 아니라 usePathname만 쓴다. 이 앱은 쿼리스트링으로 화면을
 * 가르지 않고, useSearchParams를 쓰면 정적 렌더링에서 Suspense 경계를 요구해
 * 레이아웃이 복잡해진다.
 */
export function AnalyticsBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (pathname) trackPageview(pathname);
  }, [pathname]);

  return null;
}
