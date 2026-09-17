"use client";

import posthog from "posthog-js";

/**
 * 사용 로그 수집. 부스 3일 동안 어디서 사람이 빠져나가는지 보려고 둔다.
 *
 * 수집 방침은 하나다 — **여기 적힌 이벤트만 보낸다.**
 * PostHog 기본값인 autocapture(모든 클릭·입력 자동 수집)는 끈다. 소개팅
 * 서비스라 화면에 자기소개·학과·MBTI·사진이 늘 떠 있고, 자동 수집을 켜면
 * 그게 통째로 분석 서버로 넘어간다. 약관에서 받은 개인정보 수집 동의
 * 범위(docs/보안체크리스트.md)를 벗어난다.
 *
 * 같은 이유로 사람을 가리키는 값은 서버가 준 userId(숫자)만 쓴다. 이메일·
 * 닉네임은 보내지 않는다.
 *
 * 키가 없으면 아무것도 하지 않는다 — 로컬 개발이나 키를 안 넣은 배포에서
 * 화면이 깨지면 안 되므로, 이 파일의 모든 함수는 조용히 no-op이 된다.
 */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * 세션 리플레이(화면 녹화)를 켤지. 테스터 20명한테 동의를 받고 보는
 * 2주 동안만 켜고, 축제 기간에는 끈다 — 실제 참가자의 채팅 화면이
 * 녹화되는 건 동의 범위 밖이다.
 */
const ENABLE_REPLAY = process.env.NEXT_PUBLIC_POSTHOG_REPLAY === "true";

let ready = false;

/**
 * 보내는 이벤트 목록. 여기 없는 이름은 타입이 막는다.
 *
 * 축제가 끝나면 다시 모을 수 없어서, 붙이는 시점에 필요한 걸 다 정해둔다.
 * 안 심은 이벤트는 나중에 영영 없는 데이터다.
 */
export type AnalyticsEvent =
  /** 온보딩 5단계 중 한 화면에 도착 — 단계별 이탈률의 재료 */
  | { name: "onboarding_step_viewed"; props: { step: OnboardingStep } }
  | { name: "onboarding_completed"; props?: never }
  /** 콕을 보낸 지점. 탐색 목록에서 바로 보내는지, 상세를 보고 보내는지 */
  | { name: "cook_sent"; props: { from: "explore" | "profile_detail" | "kok" } }
  | { name: "cook_accepted"; props?: never }
  | { name: "match_created"; props?: never }
  | { name: "chat_message_sent"; props?: never }
  /** 채팅 신뢰성 — ACK 10초 안에 안 온 경우 */
  | { name: "chat_ack_timeout"; props?: never }
  | { name: "chat_socket_error"; props: { code: string } }
  /** 탐색 필터를 실제로 쓰는 사람이 얼마나 되는지 */
  | { name: "explore_filter_applied"; props: { count: number } }
  /** PWA 설치 — 아이폰 웹푸시가 설치를 전제로 해서 도달률의 상한이 된다 */
  | { name: "pwa_install_state"; props: { state: string } }
  | { name: "pwa_install_result"; props: { outcome: "accepted" | "dismissed" } }
  | { name: "push_permission"; props: { result: NotificationPermission } };

export type OnboardingStep =
  | "email"
  | "basic"
  | "mbti"
  | "hobby"
  | "optional"
  | "done";

export function initAnalytics() {
  if (ready || !POSTHOG_KEY || typeof window === "undefined") return;
  ready = true;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // 아래 두 개가 이 파일의 핵심이다. 위 주석 참고.
    autocapture: false,
    capture_pageview: false,
    // 사용자가 화면을 떠날 때 마지막 이벤트를 놓치지 않게 한다.
    capture_pageleave: true,
    // 로그인한 사람만 프로필을 만든다 — 비로그인 방문자까지 사람으로 세면
    // 무료 한도를 쓸데없이 깎아먹는다.
    person_profiles: "identified_only",
    disable_session_recording: !ENABLE_REPLAY,
    session_recording: {
      // 입력값은 전부 가린다. 자기소개·비밀번호·인증코드가 여기 다 들어온다.
      maskAllInputs: true,
      // 가려야 할 텍스트에는 화면에서 data-private를 달면 된다.
      maskTextSelector: "[data-private]",
    },
  });
}

/** 이벤트 하나 보낸다. 키가 없거나 실패해도 화면은 그대로 굴러가야 한다. */
export function track(event: AnalyticsEvent) {
  if (!ready) return;
  try {
    posthog.capture(event.name, event.props);
  } catch {
    // 로그 수집 실패로 사용자 흐름을 막지 않는다.
  }
}

/**
 * 로그인 성공 시점에 부른다. 이메일·닉네임이 아니라 userId만 넘긴다.
 *
 * 이걸 불러야 "가입 → 콕 → 매칭"이 한 사람의 여정으로 이어진다. 안 부르면
 * 익명 ID가 기기마다 따로 잡혀서 퍼널이 끊긴다.
 */
export function identifyUser(
  userId: number,
  role: "participant" | "admin" | "super",
) {
  if (!ready) return;
  try {
    posthog.identify(String(userId), { role });
  } catch {
    // 무시
  }
}

/** 로그아웃·세션 만료 시점. 다음 사람이 같은 폰을 쓸 때 섞이지 않게 끊는다. */
export function resetAnalytics() {
  if (!ready) return;
  try {
    posthog.reset();
  } catch {
    // 무시
  }
}

/**
 * 화면 이동 기록. App Router는 SPA 전환이라 PostHog가 자동으로 잡지 못해서
 * (capture_pageview: false) AnalyticsBootstrap이 경로가 바뀔 때마다 부른다.
 *
 * 경로를 그대로 보내지 않는다 — /profile/12, /match/34처럼 URL에 남의 userId와
 * 매칭 ID가 들어 있어서, 숫자 자리는 [id]로 덮어 어떤 종류의 화면인지만 남긴다.
 */
export function trackPageview(pathname: string) {
  if (!ready) return;
  try {
    posthog.capture("$pageview", { $current_url: maskPath(pathname) });
  } catch {
    // 무시
  }
}

function maskPath(pathname: string) {
  return pathname.replace(/\/\d+/g, "/[id]");
}
