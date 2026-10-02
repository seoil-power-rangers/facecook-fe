/**
 * 서비스 종료 처리(facecook-fe#127). 종료 시각이 지나면 BE가 모든 API를 401 `SERVICE_ENDED`로 막고,
 * 화면은 어느 주소로 들어와도 종료 화면(`/ended`)을 보여 준다.
 *
 * 화면 전환은 세 갈래다.
 *  - 새로 여는 페이지: `src/proxy.ts`가 서버에서 `/ended`로 보낸다.
 *  - 열려 있는 화면(정각): `ServiceEndWatcher`가 종료 시각 무렵 서버에 종료 여부를 물어 옮긴다.
 *    API를 부르지 않고 가만히 있는 화면(로그인·미션 화면 등)도 이걸로 바뀐다.
 *  - 열려 있는 화면(API 응답): API가 `SERVICE_ENDED`를 돌려주면 `goToServiceEnded()`로 옮긴다.
 *
 * React·Next 없이 쓰는 순수 모듈이다 — proxy와 테스트에서도 불러 쓴다.
 */

export const SERVICE_ENDED_PATH = "/ended";
export const SERVICE_ENDED_CODE = "SERVICE_ENDED";
/** proxy가 서버 시계로 종료 여부를 답하는 주소. 응답: `{ "ended": boolean }`. */
export const SERVICE_END_STATUS_PATH = "/service-end-status";

/** 종료 시각 몇 분 전부터 서버에 물어보기 시작하는지. 휴대폰 시계가 조금 늦어도 정각 무렵에 바뀌게 한다. */
export const WATCH_LEAD_MS = 2 * 60_000;
/** 물어보기 시작한 뒤 다시 물어보는 간격. */
export const WATCH_POLL_MS = 30_000;
/** setTimeout이 받을 수 있는 최대 지연(약 24.8일). 넘기면 바로 실행돼 버린다. */
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * 종료 시각(`SERVICE_END_AT`, 시간대를 포함한 ISO 형식)을 밀리초로 읽는다. 값이 없거나 읽을 수 없으면 null —
 * 잘못 적은 값 때문에 행사 중에 서비스가 닫히는 쪽이 더 위험하다.
 */
export function parseServiceEndAt(endAt: string | undefined): number | null {
  if (!endAt) return null;
  const endMs = Date.parse(endAt);
  return Number.isNaN(endMs) ? null : endMs;
}

/** 종료 시각이 지났는지. 서버(proxy)에서 쓴다. */
export function isServiceEnded(endAt: string | undefined, nowMs: number): boolean {
  const endMs = parseServiceEndAt(endAt);
  return endMs !== null && nowMs >= endMs;
}

/**
 * 지금부터 서버에 물어보기 시작할 때까지 기다릴 시간. 이미 그 구간이면 0.
 * setTimeout 한도를 넘지 않게 자르므로, 깨어났을 때 아직 이르면 다시 기다리면 된다.
 */
export function watchDelayMs(endAtMs: number, nowMs: number): number {
  return Math.min(Math.max(endAtMs - WATCH_LEAD_MS - nowMs, 0), MAX_TIMEOUT_MS);
}

/** API 오류 코드가 서비스 종료면 종료 화면으로 페이지를 새로 연다. 옮겼으면 true. */
export function redirectIfServiceEnded(code: string | undefined): boolean {
  if (code !== SERVICE_ENDED_CODE) return false;
  goToServiceEnded();
  return true;
}

/** 뒤로 가기로 기존 화면에 돌아오지 않게 현재 기록을 바꿔 연다. */
export function goToServiceEnded() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === SERVICE_ENDED_PATH) return;
  window.location.replace(SERVICE_ENDED_PATH);
}
