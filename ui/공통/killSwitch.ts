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

/** 대시보드에서 명시적으로 끈 항목만 들어온다. 여기 없으면 켜진 상태다. */
let disabled = new Set<string>();
const listeners = new Set<() => void>();

function publish() {
  for (const listener of listeners) listener();
}

/**
 * 플래그 변화를 구독한다. initAnalytics()가 한 번 부른다.
 *
 * 콜백이 넘겨주는 배열은 **켜진 플래그만** 담는다. 그래서 그 배열에 있는지로
 * 판단하면 정작 꺼진 플래그를 영영 못 잡는다 — 조건의 앞부분이 먼저 거짓이
 * 되어 끄는 코드에 닿지 못한다. 값을 직접 확인해야 한다.
 *
 * getFeatureFlag는 만든 적 없는 플래그에 undefined를 주므로, false와 엄격히
 * 비교하면 "설정한 적 없음"은 켜진 채로 남는다 — 기본값이 켜짐이라는 원칙이
 * 여기서 지켜진다.
 *
 * send_event를 끄는 이유: 비상 스위치를 확인하는 내부 조회일 뿐인데 켜두면
 * 갱신될 때마다 $feature_flag_called가 쌓여 무료 한도를 깎아먹는다.
 *
 * @param replayAllowed 환경변수로 리플레이를 켠 배포인지. false면 스위치를
 *   다시 켜도 녹화를 시작하지 않는다 — 환경변수가 상위 규칙이다.
 */
export function startWatchingKillSwitches(
  posthog: PostHog,
  { replayAllowed }: { replayAllowed: boolean },
) {
  try {
    posthog.onFeatureFlags(() => {
      const next = new Set<string>();
      for (const key of ALL_SWITCHES) {
        if (posthog.getFeatureFlag(key, { send_event: false }) === false) {
          next.add(key);
        }
      }

      const wasReplayOff = disabled.has("session-replay");
      const isReplayOff = next.has("session-replay");
      disabled = next;
      publish();

      /*
       * 리플레이만 여기서 직접 여닫는다. 다른 스위치는 화면이 구독해서 다시
       * 그리면 되지만, 녹화는 이미 돌고 있는 것을 멈추고 다시 시작해야
       * 의미가 있다. 껐다 켰을 때 되살아나지 않으면 스위치가 아니라 일회용
       * 차단기가 된다.
       */
      if (isReplayOff && !wasReplayOff) {
        posthog.stopSessionRecording();
      } else if (!isReplayOff && wasReplayOff && replayAllowed) {
        posthog.startSessionRecording();
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
