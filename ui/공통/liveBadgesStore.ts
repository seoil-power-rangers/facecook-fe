"use client";

import { getCooks, type CookListResponse } from "@ui/받은콕/cookApi";
import { getMatches, type MatchResponse } from "@ui/매칭/matchApi";
import { LIVE_BADGE_POLL_INTERVAL_MS } from "@ui/공통/constants";
import { reportError } from "@ui/공통/analytics";
import { isEnabled, subscribeKillSwitches } from "@ui/공통/killSwitch";
import { createLatestOnlyFetcher } from "./liveBadgesCore";

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
let stopWatchingKillSwitch: (() => void) | null = null;

/**
 * 응답 순서 규칙(폴링은 진행 중이면 건너뛴다, 강제 갱신·무효화는 이전 응답을 버린다)은
 * liveBadgesCore.ts가 담당한다. 콕과 매칭을 따로 두는 이유는 하나가 실패해도 다른 배지가
 * 사라지지 않게 하기 위해서다.
 *
 * 진행 중인 요청을 이 시간 넘게 기다렸으면 멈춘 것으로 보고 새로 시작한다(폴링 주기의 3배).
 */
const STALE_REQUEST_MS = LIVE_BADGE_POLL_INTERVAL_MS * 3;

const cooksFetcher = createLatestOnlyFetcher({
  fetch: getCooks,
  onValue: (cooks) => {
    state = { ...state, cooks };
    notify();
  },
  onError: reportError,
  staleAfterMs: STALE_REQUEST_MS,
});

const matchesFetcher = createLatestOnlyFetcher({
  fetch: getMatches,
  onValue: (matches) => {
    state = { ...state, matches };
    notify();
  },
  onError: reportError,
  staleAfterMs: STALE_REQUEST_MS,
});

function notify() {
  for (const listener of listeners) listener();
}

/** 진행 중인 콕·매칭 조회의 응답을 모두 버린다. 이미 나간 요청은 취소되지 않고 응답만 무시된다. */
function invalidateInFlight() {
  cooksFetcher.invalidate();
  matchesFetcher.invalidate();
}

/**
 * 로그아웃·로그인 시 호출한다 — 이전 계정의 배지 데이터가 새 계정 화면에 잠깐이라도 보이면 안 된다.
 *
 * 로그인 전에 시작된 요청이 늦게 도착해도 새 계정 상태를 덮지 못하도록 진행 중인 응답도 함께 버린다.
 */
export function resetLiveBadges() {
  invalidateInFlight();
  state = EMPTY_STATE;
  notify();
}

/** 화면이 보이고 대시보드의 "live-badge-polling" 킬스위치가 켜져 있을 때만 조회한다. */
function canFetch() {
  if (document.visibilityState !== "visible") return false;
  // 대시보드에서 "live-badge-polling"을 끄면 여기서 막힌다 — 부하가 몰릴 때
  // 재배포 없이 즉시 멈출 수 있는 비상 스위치다.
  return isEnabled("live-badge-polling");
}

function poll() {
  if (!canFetch()) return;
  // 둘을 따로 받는다. 묶으면 한쪽이 실패할 때 멀쩡한 다른 배지까지 사라진다.
  cooksFetcher.poll();
  matchesFetcher.poll();
}

/**
 * 콕·매칭을 서버 상태로 다시 계산한다. 거절·취소처럼 서버 상태를 바꾼 직후에 부른다.
 *
 * 전제조건: 서버에서 변경이 이미 성공했다.
 *
 * 부작용: 진행 중이던 조회는 응답을 버리고, 변경 이후의 조회를 콕·매칭 각각 한 번 새로 보낸다.
 * 구독자가 없어도 상태는 갱신된다. 화면이 숨겨져 있거나 킬스위치가 꺼져 있으면 새 조회는 보내지 않지만
 * (폴링과 같은 조건이다), 진행 중이던 조회의 응답은 그래도 버린다 — 변경 전에 시작한 응답이 나중에
 * 도착해 변경 전 상태를 기록하면 안 되기 때문이다. 이때 배지를 맞추려면 호출부가
 * {@link dropReceivedCookFromLiveBadges}로 결과를 직접 반영한다.
 */
export function refreshLiveBadgesNow() {
  if (!canFetch()) {
    invalidateInFlight();
    return;
  }
  cooksFetcher.force();
  matchesFetcher.force();
}

/**
 * 받은 콕 하나를 배지 상태에서 바로 뺀다. 거절이 서버에서 성공한 직후, 다음 조회를 기다리지 않고 숫자를
 * 맞추는 데 쓴다(킬스위치가 꺼져 있어 새 조회가 나가지 않을 때도 배지가 맞도록).
 *
 * 전제조건: 서버에서 그 콕의 거절이 이미 성공했다. {@link refreshLiveBadgesNow} 뒤에 부른다 — 그 전에
 * 시작한 조회의 응답이 이 결과를 되돌리지 못하게 먼저 무효화해야 한다.
 *
 * 부작용: 콕 상태가 아직 없으면(첫 조회 전) 아무 것도 하지 않는다. 있으면 구독자에게 알린다.
 */
export function dropReceivedCookFromLiveBadges(cookId: number) {
  const cooks = state.cooks;
  if (!cooks) return;
  state = {
    ...state,
    cooks: { ...cooks, received: cooks.received.filter((cook) => cook.cookId !== cookId) },
  };
  notify();
}

function handleVisibilityChange() {
  // 숨겨진 사이에 도착한 응답은 버린다. 다시 보이면 새로 조회한다.
  if (document.visibilityState === "visible") poll();
  else invalidateInFlight();
}

function start() {
  poll();
  intervalId = setInterval(poll, LIVE_BADGE_POLL_INTERVAL_MS);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  // 스위치가 꺼지는 순간 진행 중인 조회의 응답을 버린다. 꺼진 뒤에는 폴링이 없어 다시 교정되지 않는다.
  stopWatchingKillSwitch = subscribeKillSwitches(() => {
    if (!isEnabled("live-badge-polling")) invalidateInFlight();
  });
}

function stop() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  stopWatchingKillSwitch?.();
  stopWatchingKillSwitch = null;
  // 구독이 끝난 뒤에 도착한 응답이 상태를 바꾸지 않게 한다.
  invalidateInFlight();
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
