"use client";

import { useSyncExternalStore } from "react";
import type { PostHog } from "posthog-js";

/**
 * 원격 끄기 스위치. PostHog Feature Flags를 A/B가 아니라 **비상 차단**으로 쓴다.
 *
 * 축제는 3일뿐이라 롤백에 쓸 시간이 없다. 부하가 몰려 RDS가 버거워지거나
 * 실시간 갱신이 말썽을 부리면, Vercel 재배포를 기다리는 몇 분이 그대로
 * 장애 시간이 된다. 대시보드에서 토글 한 번으로 끌 수 있게 해둔다.
 *
 * **기본값은 항상 "켜짐"이다.** 플래그를 못 받아왔을 때(키가 없다, 광고
 * 차단기가 PostHog를 막았다, 네트워크가 끊겼다) 기능이 꺼지면 안 된다 —
 * 평상시를 망가뜨리지 않고 비상시에만 개입하는 게 이 스위치의 역할이다.
 * 그래서 끄려면 대시보드에서 플래그를 명시적으로 off로 만들어야 한다.
 */

export type KillSwitch =
  /** 콕·메시지 배지를 주기적으로 다시 조회하는 폴링 */
  | "live-badge-polling"
  /** 미션 진행 상황 실시간 갱신(STOMP) */
  | "mission-realtime"
  /** 세션 리플레이(화면 녹화) */
  | "session-replay";

/** 대시보드에서 플래그를 못 받아온 항목은 여기 없다 — 즉 켜진 상태로 본다. */
let disabled = new Set<string>();
const listeners = new Set<() => void>();

function publish() {
  for (const listener of listeners) listener();
}

/**
 * 플래그 변화를 구독한다. initAnalytics()가 한 번 부른다.
 *
 * onFeatureFlags는 최초 로딩과 이후 갱신에 모두 불리므로, 축제 도중에
 * 대시보드에서 끄면 화면을 새로고침하지 않아도 반영된다.
 */
export function startWatchingKillSwitches(posthog: PostHog) {
  try {
    posthog.onFeatureFlags((flags) => {
      const next = new Set<string>();
      for (const key of ALL_SWITCHES) {
        // 플래그가 있고 명시적으로 false일 때만 끈다.
        if (flags.includes(key) && posthog.isFeatureEnabled(key) === false) {
          next.add(key);
        }
      }
      disabled = next;
      publish();

      /*
       * 리플레이만 여기서 직접 끊는다. 다른 스위치는 화면이 구독해서
       * 다시 그리면 되지만, 녹화는 이미 돌고 있는 것을 멈춰야 의미가 있다.
       */
      if (next.has("session-replay")) {
        posthog.stopSessionRecording();
      }
    });
  } catch {
    // 구독에 실패하면 전부 켜진 상태로 남는다 — 그게 안전한 쪽이다.
  }
}

const ALL_SWITCHES: KillSwitch[] = [
  "live-badge-polling",
  "mission-realtime",
  "session-replay",
];

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** 컴포넌트 밖(폴링 루프 등)에서도 물어볼 수 있게 훅이 아닌 함수로 둔다. */
export function isEnabled(name: KillSwitch) {
  return !disabled.has(name);
}

function getServerSnapshot() {
  return true;
}

/**
 * 기능이 켜져 있는지. 대시보드에서 끄면 이 값이 false로 바뀌면서 화면이
 * 다시 그려진다.
 */
export function useKillSwitch(name: KillSwitch) {
  return useSyncExternalStore(
    subscribe,
    () => isEnabled(name),
    getServerSnapshot,
  );
}
