/**
 * `limit`개까지만 동시에 실행되게 막는 게이트.
 *
 * 배치 함수 호출 한 번만 안에서 동시 개수를 제한하면, 같은 배치가 겹쳐 불릴 때(예:
 * 관리자 화면에서 완료 처리가 409로 실패해 목록을 다시 불러올 때) 실제 동시 요청
 * 수는 그 배수가 된다 — 호출 하나가 5개로 제한해도 두 번 겹치면 10개가 나간다.
 * 게이트를 호출부들이 공유하면(모듈 스코프에 하나만 만들어 두는 식으로) 전체
 * 동시 실행 수가 항상 `limit`을 넘지 않는다.
 *
 * 전제조건: `limit`은 1 이상이어야 뜻이 있다(그 이하는 1로 취급한다).
 *
 * 부작용: 없다(내부에 대기열만 들고 있다) — `run`에 넘긴 함수 자체의 부작용은
 * 그대로 따른다.
 */
export interface ConcurrencyGate {
  /** 자리가 나면 `fn`을 실행한다. 이미 `limit`만큼 실행 중이면 자리가 날 때까지 기다린다. */
  run: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function createConcurrencyGate(limit: number): ConcurrencyGate {
  const capacity = Math.max(1, limit);
  let active = 0;
  const queue: (() => void)[] = [];

  function schedule() {
    if (active >= capacity) return;
    const task = queue.shift();
    if (!task) return;
    active += 1;
    task();
  }

  return {
    run<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        queue.push(() => {
          fn()
            .then(resolve, reject)
            .finally(() => {
              active -= 1;
              schedule();
            });
        });
        schedule();
      });
    },
  };
}
