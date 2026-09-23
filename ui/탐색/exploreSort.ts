/**
 * 탐색 정렬에 필요한 최소 정보만 담는다. `ProfileResponse` 전체를 몰라도 되게 일부러
 * 좁혀 뒀다 — 이 모듈이 `@ui/...` 별칭이나 React 없이 순수하게 테스트되려면(`ui/공통/liveBadgesCore.ts`와
 * 같은 패턴) `profileApi.ts`를 import하면 안 되기 때문이다.
 */
export interface SortableMember {
  userId: number;
  isActive: boolean;
}

/**
 * 활동 중인 사람을 앞으로, 나머지는 세션 시드로 섞어서 정렬한다.
 *
 * 활동 여부는 인자로 받은 `isActive`를 그대로 쓴다 — 서버가 내려준 값을 호출부가 미리
 * 채워서 넘기고, 이 함수는 `Date.now()`를 비롯해 현재 시각·저장소 어느 것도 읽지 않는다.
 * 그래서 같은 입력이면 언제 불러도 같은 결과가 나온다(순수 함수).
 *
 * 전제조건: 없음.
 *
 * 부작용: 없다 — 새 배열을 만들어 돌려주고 원본 배열은 바꾸지 않는다.
 */
export function sortMembersForSession<T extends SortableMember>(members: T[], seed: number): T[] {
  return [...members].sort((a, b) => {
    const activeGap = Number(b.isActive) - Number(a.isActive);
    if (activeGap !== 0) return activeGap;
    return mix(a.userId, seed) - mix(b.userId, seed);
  });
}

/** userId를 씨앗과 섞어 고르게 흩어진 수를 만든다. 같은 입력이면 같은 값이다. */
function mix(userId: number, seed: number): number {
  let h = (userId ^ seed) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}
