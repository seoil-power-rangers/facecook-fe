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

const EMPTY_STATE: LiveBadgesState = { cooks: null, matches: null };

let state: LiveBadgesState = EMPTY_STATE;
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * 로그아웃/로그인으로 계정이 바뀌어도 이 스토어는 모듈 전역이라 그대로
 * 살아있다 — 세대 번호로 "이 응답이 지금 계정 걸로 시작한 요청인지"를
 * 표시해서, 리셋 이전에 시작된 응답이 늦게 도착해도 새 계정 상태를 덮어쓰지
 * 못하게 막는다.
 */
let generation = 0;

function notify() {
  for (const listener of listeners) listener();
}

/** 로그아웃·로그인 시 호출한다 — 이전 계정의 배지 데이터가 새 계정 화면에 잠깐이라도 보이면 안 된다. */
export function resetLiveBadges() {
  generation += 1;
  state = EMPTY_STATE;
  notify();
}

function refresh() {
  if (document.visibilityState !== "visible") return;
  // 대시보드에서 "live-badge-polling"을 끄면 여기서 막힌다 — 부하가 몰릴 때
  // 재배포 없이 즉시 멈출 수 있는 비상 스위치다.
  if (!isEnabled("live-badge-polling")) return;

  const requestGeneration = generation;

  // 둘을 따로 받는다. 묶으면 한쪽이 실패할 때 멀쩡한 다른 배지까지 사라진다.
  getCooks()
    .then((cooks) => {
      if (requestGeneration !== generation) return;
      state = { ...state, cooks };
      notify();
    })
    .catch(reportError);

  getMatches()
    .then((matches) => {
      if (requestGeneration !== generation) return;
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
