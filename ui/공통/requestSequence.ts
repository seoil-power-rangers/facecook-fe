/**
 * 같은 목록을 여러 번 조회할 때 "가장 최근에 시작한 요청의 응답만 화면에 반영"하기 위한 순번표.
 *
 * 응답은 요청 순서대로 도착한다는 보장이 없다. 거절 직후에 오래된 목록 응답이 늦게 도착하면 방금 지운
 * 카드가 되살아난다. 요청을 시작할 때 `begin`으로 번호를 받고, 응답이 왔을 때 `isLatest`가 참일 때만
 * 상태를 바꾼다.
 */
export interface RequestSequence {
  /** 새 요청을 시작한다. 이전에 시작한 모든 요청은 더 이상 최신이 아니다. */
  begin: () => number;
  /** 이 번호가 아직 가장 최근 요청인지. */
  isLatest: (requestId: number) => boolean;
  /** 진행 중인 요청을 모두 무효로 한다. 새 요청은 시작하지 않는다. */
  invalidate: () => void;
}

export function createRequestSequence(): RequestSequence {
  let current = 0;
  return {
    begin: () => ++current,
    isLatest: (requestId) => requestId === current,
    invalidate: () => {
      current += 1;
    },
  };
}
