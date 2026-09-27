/**
 * 여러 화면이 같은 데이터를 따로 조회하지 않게 하는 "한 번 받아 나눠 쓰기" 규칙.
 *
 * 내 프로필처럼 화면을 옮길 때마다 여러 곳(진입 가드, 화면 본문)이 같은 값을 부르는 데이터에 쓴다. 이 파일은
 * 그 규칙만 담은 순수 로직이라 React·타이머·`@ui` 별칭 없이 테스트할 수 있다(scripts/run-tests.mjs 참고).
 *
 * 규칙:
 * - `get`은 보관한 값이 `maxAgeMs`보다 새것이면 요청 없이 그 값을 돌려준다.
 * - 보관한 값이 없거나 오래됐는데 진행 중인 요청이 있으면 새로 보내지 않고 그 요청을 함께 기다린다.
 *   같은 순간에 여러 곳이 불러도 요청은 하나다.
 * - 실패는 보관하지 않는다. 기다리던 곳 모두 같은 오류를 받고, 다음 `get`은 새로 요청한다.
 * - `set`은 서버가 돌려준 최신 값(생성·수정 응답)으로 보관값을 바꾼다. 그 전에 시작한 요청의 응답은
 *   보관값을 덮지 못한다.
 * - `clear`는 보관값을 버린다. 계정이 바뀔 때 쓴다. 그 전에 시작한 요청의 응답은 보관되지 않는다 —
 *   이전 계정의 값이 새 계정 화면에 나오면 안 된다.
 */
export interface SharedRequestOptions<T> {
  fetch: () => Promise<T>;
  /** 보관한 값을 이 시간 동안 그대로 쓴다. */
  maxAgeMs: number;
  now?: () => number;
}

export interface SharedRequest<T> {
  /** 새 보관값이 있으면 그 값, 없으면 진행 중인 요청 또는 새 요청의 결과. */
  get: () => Promise<T>;
  /** 서버가 돌려준 최신 값으로 보관값을 바꾼다. */
  set: (value: T) => void;
  /** 보관값을 버리고, 진행 중인 요청의 응답도 보관하지 않게 한다. */
  clear: () => void;
}

export function createSharedRequest<T>(options: SharedRequestOptions<T>): SharedRequest<T> {
  const now = options.now ?? Date.now;
  let generation = 0;
  let cached: { value: T; at: number } | null = null;
  let inFlight: Promise<T> | null = null;

  function start(): Promise<T> {
    const mine = generation;
    let request: Promise<T>;
    try {
      request = options.fetch();
    } catch (error) {
      request = Promise.reject(error);
    }

    const shared = request.then(
      (value) => {
        if (mine === generation) {
          cached = { value, at: now() };
          inFlight = null;
        }
        return value;
      },
      (error: unknown) => {
        if (mine === generation) inFlight = null;
        throw error;
      },
    );
    inFlight = shared;
    return shared;
  }

  return {
    get() {
      if (cached && now() - cached.at < options.maxAgeMs) {
        return Promise.resolve(cached.value);
      }
      return inFlight ?? start();
    },
    set(value) {
      generation += 1;
      inFlight = null;
      cached = { value, at: now() };
    },
    clear() {
      generation += 1;
      inFlight = null;
      cached = null;
    },
  };
}
