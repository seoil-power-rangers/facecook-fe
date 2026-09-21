/**
 * 배지용 조회 하나(콕 또는 매칭)가 지켜야 하는 "응답 순서" 규칙.
 *
 * 5초마다 폴링하는 조회는 응답이 주기보다 늦거나 순서가 뒤바뀔 수 있다. 오래된 응답이 나중에
 * 도착해서 최신 상태를 덮어쓰면 방금 거절한 카드의 배지가 되살아난다. 이 파일은 그 규칙만 담은
 * 순수 로직이라 React·타이머·`@ui` 별칭 없이 테스트할 수 있다(scripts/run-tests.mjs 참고).
 *
 * 규칙:
 * - 폴링(`poll`)은 진행 중인 요청이 있으면 새로 보내지 않는다. 응답이 주기보다 늦어도 그 응답이
 *   반영되고, 요청이 쌓이지도 않는다. 다만 `staleAfterMs`를 넘겨서 멈춘 것으로 보이는 요청은
 *   버리고 새로 시작한다.
 * - 강제 갱신(`force`)은 진행 중인 요청을 무효화하고 지금 새 요청을 시작한다. 거절·취소처럼 서버 상태를
 *   바꾼 직후에 쓴다 — 변경 전에 시작한 요청의 응답이 변경 뒤에 도착해도 반영되지 않는다.
 * - 무효화(`invalidate`)는 진행 중인 요청의 응답을 버린다. 계정이 바뀌거나 화면이 숨겨지거나
 *   구독이 끝날 때 쓴다.
 * - 가장 최근에 시작한 요청의 응답만 반영한다. 무효화된 요청은 성공이든 실패든 아무 것도 바꾸지 못한다.
 */
export interface LatestOnlyFetcherOptions<T> {
  fetch: () => Promise<T>;
  onValue: (value: T) => void;
  onError: (error: unknown) => void;
  /** 진행 중인 요청을 이 시간 넘게 기다렸으면 멈춘 것으로 보고 폴링이 새로 시작한다. */
  staleAfterMs: number;
  now?: () => number;
}

export interface LatestOnlyFetcher {
  /** 진행 중인 요청이 없거나 멈춘 것으로 보일 때만 새 요청을 보낸다. */
  poll: () => void;
  /** 진행 중이던 요청을 무효화하고 새 요청을 반드시 한 번 보낸다. */
  force: () => void;
  /** 진행 중인 요청의 응답을 버린다. 다음 폴링은 새 요청을 보낸다. */
  invalidate: () => void;
}

export function createLatestOnlyFetcher<T>(options: LatestOnlyFetcherOptions<T>): LatestOnlyFetcher {
  const now = options.now ?? Date.now;
  let sequence = 0;
  let pendingSince: number | null = null;

  function start() {
    const mine = ++sequence;
    pendingSince = now();

    let request: Promise<T>;
    try {
      request = options.fetch();
    } catch (error) {
      request = Promise.reject(error);
    }

    request.then(
      (value) => {
        if (mine !== sequence) return;
        pendingSince = null;
        try {
          options.onValue(value);
        } catch (error) {
          options.onError(error);
        }
      },
      (error) => {
        if (mine !== sequence) return;
        pendingSince = null;
        options.onError(error);
      },
    );
  }

  return {
    poll() {
      const inFlight = pendingSince !== null && now() - pendingSince < options.staleAfterMs;
      if (inFlight) return;
      start();
    },
    force() {
      start();
    },
    invalidate() {
      sequence += 1;
      pendingSince = null;
    },
  };
}
