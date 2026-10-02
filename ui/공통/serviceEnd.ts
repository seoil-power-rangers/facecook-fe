/**
 * 서비스 종료 처리(facecook-fe#127). 종료 시각이 지나면 BE가 모든 API를 401 `SERVICE_ENDED`로 막고,
 * 화면은 어느 주소로 들어와도 종료 화면(`/ended`)을 보여 준다.
 *
 * 화면 전환은 세 갈래다.
 *  - 새로 여는 페이지: `src/proxy.ts`가 서버에서 `/ended`로 보낸다.
 *  - 열려 있는 화면(정각): `ServiceEndWatcher`가 서버에 종료 여부와 남은 시간을 물어 정각에 옮긴다.
 *    API를 부르지 않고 가만히 있는 화면(로그인·미션 화면 등)도 이걸로 바뀐다.
 *  - 열려 있는 화면(API 응답): API가 `SERVICE_ENDED`를 돌려주면 `goToServiceEnded()`로 옮긴다.
 *
 * React·Next 없이 쓰는 순수 모듈이다 — proxy와 테스트에서도 불러 쓴다.
 */

export const SERVICE_ENDED_PATH = "/ended";
export const SERVICE_ENDED_CODE = "SERVICE_ENDED";
/** proxy가 서버 시계로 종료 여부를 답하는 주소. 응답은 {@link ServiceEndStatus}. */
export const SERVICE_END_STATUS_PATH = "/service-end-status";

/**
 * `ended`: 서버 시계로 종료됐는지. `remainingMs`: 서버 시계로 종료까지 남은 시간(종료 시각이 없으면 null).
 * 열려 있는 화면은 휴대폰 시계를 쓰지 않고 이 값으로 다음 확인 시각을 정한다 — 휴대폰 시계가 틀려도 정각에 바뀐다.
 */
export interface ServiceEndStatus {
  ended: boolean;
  remainingMs: number | null;
}

/** 종료 시각 이만큼 전부터는 짧은 간격으로 묻는다. */
export const WATCH_LEAD_MS = 2 * 60_000;
/** 종료 직전·직후와 확인이 실패했을 때 다시 묻는 간격. */
export const WATCH_POLL_MS = 30_000;
/** 종료가 멀어도 이 간격마다는 다시 묻는다. 재배포로 종료 시각이 바뀌어도 따라간다. */
export const WATCH_MAX_INTERVAL_MS = 10 * 60_000;
/** 종료 시각 정각에 묻지 않고 조금 뒤에 묻는다 — 서버가 아직 종료 전이라고 답하지 않게. */
const END_GRACE_MS = 1_000;

/**
 * 종료 시각(`SERVICE_END_AT`, 시간대를 포함한 ISO 형식)을 밀리초로 읽는다. 값이 없거나 읽을 수 없으면 null —
 * 잘못 적은 값 때문에 행사 중에 서비스가 닫히는 쪽이 더 위험하다.
 */
export function parseServiceEndAt(endAt: string | undefined): number | null {
  if (!endAt) return null;
  const endMs = Date.parse(endAt);
  return Number.isNaN(endMs) ? null : endMs;
}

/** 서버(proxy)가 답하는 종료 상태. */
export function serviceEndStatus(endAt: string | undefined, nowMs: number): ServiceEndStatus {
  const endMs = parseServiceEndAt(endAt);
  if (endMs === null) return { ended: false, remainingMs: null };
  return { ended: nowMs >= endMs, remainingMs: Math.max(endMs - nowMs, 0) };
}

/** 종료 시각이 지났는지. 서버(proxy)에서 쓴다. */
export function isServiceEnded(endAt: string | undefined, nowMs: number): boolean {
  return serviceEndStatus(endAt, nowMs).ended;
}

/**
 * 서버가 알려 준 남은 시간으로 다음에 물을 때까지 기다릴 시간을 정한다. 기다리는 시간은 휴대폰 시계와 관계없이 흐른다.
 *  - 2분보다 많이 남았으면 "남은 시간 − 2분" 뒤(최대 10분 뒤)
 *  - 2분 이내면 종료 1초 뒤(최대 30초 뒤)
 */
export function nextCheckDelayMs(remainingMs: number): number {
  if (remainingMs > WATCH_LEAD_MS) return Math.min(remainingMs - WATCH_LEAD_MS, WATCH_MAX_INTERVAL_MS);
  return Math.min(remainingMs + END_GRACE_MS, WATCH_POLL_MS);
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
