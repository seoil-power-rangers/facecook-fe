/**
 * 서비스 종료 처리(facecook-fe#127). 종료 시각이 지나면 BE가 모든 API를 401 `SERVICE_ENDED`로 막고,
 * 화면은 어느 주소로 들어와도 종료 화면(`/ended`)을 보여 준다.
 *
 * 화면 전환은 두 갈래다.
 *  - 새로 여는 페이지: `src/proxy.ts`가 서버에서 `/ended`로 보낸다.
 *  - 이미 열려 있는 화면: API가 `SERVICE_ENDED`를 돌려주면 `goToServiceEnded()`로 페이지를 새로 연다.
 *    새로 열면 proxy를 거치므로 종료 화면이 서버 기준으로 보인다.
 *
 * React·Next 없이 쓰는 순수 모듈이다 — proxy와 테스트에서도 불러 쓴다.
 */

export const SERVICE_ENDED_PATH = "/ended";
export const SERVICE_ENDED_CODE = "SERVICE_ENDED";

/**
 * 종료 시각(`SERVICE_END_AT`, 시간대를 포함한 ISO 형식)이 지났는지. 값이 없거나 읽을 수 없으면 종료하지 않은 것으로 본다 —
 * 잘못 적은 값 때문에 행사 중에 서비스가 닫히는 쪽이 더 위험하다.
 */
export function isServiceEnded(endAt: string | undefined, nowMs: number): boolean {
  if (!endAt) return false;
  const endMs = Date.parse(endAt);
  if (Number.isNaN(endMs)) return false;
  return nowMs >= endMs;
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
