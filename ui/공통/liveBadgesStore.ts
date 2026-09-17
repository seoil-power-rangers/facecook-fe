"use client";

import { getCooks, type CookListResponse } from "@ui/받은콕/cookApi";
import { getMatches, type MatchResponse } from "@ui/매칭/matchApi";
import { LIVE_BADGE_POLL_INTERVAL_MS } from "@ui/공통/constants";
import { reportError } from "@ui/공통/analytics";
import { isEnabled } from "@ui/공통/killSwitch";

/**
 * TabBar와 홈 화면이 각자 5초마다 콕/매칭을 따로 조회하면, 둘 다 떠있는
 * 화면(홈)에서는 같은 API가 매번 두 번씩 나간다 — 여기서 구독자 수와
 * 무관하게 딱 한 번만 폴링해서 공유한다. 구독자가 없으면(아무 화면도 안
 * 보고 있으면) 타이머 자체를 멈춘다.
 */
export interface LiveBadgesState {
  cooks: CookListResponse | null;
  matches: MatchResponse[] | null;
}

let state: LiveBadgesState = { cooks: null, matches: null };
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function notify() {
  for (const listener of listeners) listener();
}

function refresh() {
  if (document.visibilityState !== "visible") return;
  // 대시보드에서 "live-badge-polling"을 끄면 여기서 막힌다 — 부하가 몰릴 때
  // 재배포 없이 즉시 멈출 수 있는 비상 스위치다.
  if (!isEnabled("live-badge-polling")) return;

  // 둘을 따로 받는다. 묶으면 한쪽이 실패할 때 멀쩡한 다른 배지까지 사라진다.
  getCooks()
    .then((cooks) => {
      state = { ...state, cooks };
      notify();
    })
    .catch(reportError);

  getMatches()
    .then((matches) => {
      state = { ...state, matches };
      notify();
    })
    .catch(reportError);
}

function start() {
  refresh();
  intervalId = setInterval(refresh, LIVE_BADGE_POLL_INTERVAL_MS);
  document.addEventListener("visibilitychange", refresh);
}

function stop() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  document.removeEventListener("visibilitychange", refresh);
}

export function subscribeLiveBadges(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) start();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

export function getLiveBadgesSnapshot(): LiveBadgesState {
  return state;
}
