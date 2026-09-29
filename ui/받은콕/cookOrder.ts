/**
 * 받은 콕 목록의 순서를 정한다.
 *
 * 정렬에 필요한 최소 정보만 받는다. `CookItemResponse` 전체를 몰라도 되게 일부러
 * 좁혀 뒀다 — 이 모듈이 `@ui/...` 별칭이나 React 없이 순수하게 테스트되려면
 * (`ui/탐색/exploreSort.ts`와 같은 패턴) `cookApi.ts`를 import하면 안 되기 때문이다.
 */
export interface OrderableCook {
  status: "pending" | "matched" | "rejected" | "expired";
}

/**
 * 맞콕할 수 있는 콕을 맨 위로 올린다.
 *
 * pending만이 [맞콕하기]를 누를 수 있는 상태다. 이미 매칭된 카드가 위에 쌓여 있으면
 * 정작 지금 할 수 있는 일이 스크롤 아래에 묻힌다 — 부스에서 콕을 확인하는 시간은
 * 길지 않다.
 *
 * 나머지는 서버가 준 순서를 그대로 둔다. 서버가 최근 순으로 주므로 여기서 다시
 * 정렬하면 그 뜻이 사라진다. 그래서 상태별로 등수를 매기는 대신 pending만 앞으로
 * 뽑아내는 방식으로 둔다 — 안정 정렬이 아니어도 순서가 흐트러지지 않는다.
 *
 * 전제조건: 없음.
 *
 * 부작용: 없다 — 새 배열을 만들어 돌려주고 원본은 바꾸지 않는다.
 */
export function sortReceivedCooks<T extends OrderableCook>(cooks: T[]): T[] {
  const answerable: T[] = [];
  const rest: T[] = [];

  for (const cook of cooks) {
    if (cook.status === "pending") answerable.push(cook);
    else rest.push(cook);
  }

  return [...answerable, ...rest];
}
