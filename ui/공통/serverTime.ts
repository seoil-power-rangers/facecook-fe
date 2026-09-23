/**
 * 서버가 내려주는 시각 문자열을 읽는 규칙을 한 곳에 둔다.
 *
 * 서버(facecook-be)는 모든 시각을 **한국 시간(KST) 기준, 오프셋 없는 문자열**로 보낸다
 * (예: "2026-09-16T13:10:00", API명세). 오프셋이 없는 문자열을 `Date.parse`·`new Date`에
 * 그대로 넘기면 브라우저의 시간대로 해석돼서, 기기 시간대가 KST가 아니면 9시간 어긋난다.
 * 그래서 서버 시각은 반드시 이 파일의 함수로 읽는다.
 *
 * 이 파일은 `@ui/...` 별칭이나 React 없이 테스트되는 순수 모듈이다(scripts/run-tests.mjs 참고).
 */

const KST_OFFSET = "+09:00";
/** 문자열 끝에 이미 시간대가 붙어 있는지. 브라우저가 만든 값(`toISOString()` → "...Z")이 여기에 해당한다. */
const HAS_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;
/** JS가 확실히 해석하는 소수점 초는 3자리까지다. 서버는 나노초까지 보낼 수 있다. */
const EXTRA_FRACTION_DIGITS = /(\.\d{3})\d+/;

/**
 * 서버 시각 문자열을 절대 시각(epoch 밀리초)으로 바꾼다. 오프셋이 없으면 KST로 보고, 이미
 * 오프셋이 있으면 그대로 쓴다. 비었거나 해석할 수 없으면 `NaN`.
 */
export function parseServerTime(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  const normalized = value.trim().replace(EXTRA_FRACTION_DIGITS, "$1");
  return Date.parse(HAS_OFFSET.test(normalized) ? normalized : normalized + KST_OFFSET);
}

/** {@link parseServerTime}의 `Date` 버전. 해석할 수 없으면 `getTime()`이 `NaN`인 `Date`를 돌려준다. */
export function serverTimeToDate(value: string | null | undefined): Date {
  return new Date(parseServerTime(value));
}

/**
 * "MM-DD HH:mm". 서버 문자열 자체가 KST라 잘라서 보여주면 브라우저 시간대와 상관없이
 * 한국 시간 그대로 보인다(관리자 목록처럼 짧게 적는 곳에 쓴다).
 */
export function formatServerTimeShort(value: string): string {
  return value.replace("T", " ").slice(5, 16);
}
