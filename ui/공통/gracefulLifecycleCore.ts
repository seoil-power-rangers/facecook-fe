/**
 * 구독자가 잠깐 0이 됐다가 바로 다시 생기는 경우에 멈췄다 다시 시작하지 않게 하는 규칙.
 *
 * 탭바는 화면마다 따로 붙어 있어서, 탭을 옮기면 이전 화면의 구독이 먼저 끝나고 새 화면이 곧바로 다시 구독한다.
 * 그 틈에 폴링을 멈췄다 다시 시작하면 시작할 때마다 즉시 조회가 한 번 더 나간다(facecook-fe#105). 이 파일은 그
 * 규칙만 담은 순수 로직이라 React·DOM·`@ui` 별칭 없이 테스트할 수 있다(scripts/run-tests.mjs 참고).
 *
 * 규칙:
 * - 첫 구독이 생길 때 `start`를 부른다.
 * - 마지막 구독이 끝나도 바로 `stop`하지 않고 `graceMs`를 기다린다. 그 사이 다시 구독하면 `start`도 `stop`도
 *   부르지 않는다 — 돌던 것을 그대로 이어 쓴다.
 * - `graceMs` 동안 아무도 구독하지 않으면 그때 `stop`을 부른다.
 */
export interface GracefulLifecycleOptions {
  start: () => void;
  stop: () => void;
  /** 마지막 구독이 끝난 뒤 멈추기 전까지 기다리는 시간. */
  graceMs: number;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (timer: unknown) => void;
}

export interface GracefulLifecycle {
  /** 구독을 하나 늘린다. 돌려받은 함수를 부르면 그 구독이 끝난다(두 번 불러도 한 번만 센다). */
  acquire: () => () => void;
}

export function createGracefulLifecycle(options: GracefulLifecycleOptions): GracefulLifecycle {
  const setTimer = options.setTimer ?? ((callback, ms) => setTimeout(callback, ms));
  const clearTimer = options.clearTimer ?? ((timer) => clearTimeout(timer as ReturnType<typeof setTimeout>));
  let count = 0;
  let running = false;
  let stopTimer: unknown = null;

  function cancelPendingStop() {
    if (stopTimer === null) return;
    clearTimer(stopTimer);
    stopTimer = null;
  }

  return {
    acquire() {
      count += 1;
      cancelPendingStop();
      if (!running) {
        running = true;
        options.start();
      }

      let released = false;
      return () => {
        if (released) return;
        released = true;
        count -= 1;
        if (count > 0) return;
        cancelPendingStop();
        stopTimer = setTimer(() => {
          stopTimer = null;
          if (count > 0 || !running) return;
          running = false;
          options.stop();
        }, options.graceMs);
      };
    },
  };
}
