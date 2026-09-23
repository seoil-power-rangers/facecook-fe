/**
 * `items`를 `mapper`로 변환하되, 한 번에 최대 `limit`개만 동시에 진행한다.
 *
 * 고유 사용자 수만큼 요청을 한꺼번에 쏘면(예: 매칭이 늘어난 관리자 화면의 이름 조회)
 * 가장 느린 요청 하나가 전체를 물고 늘어진다 — 동시 개수를 제한해서 완만하게 만든다.
 *
 * 전제조건: `limit`은 1 이상이어야 뜻이 있다(그 이하는 1로 취급한다).
 *
 * 부작용: 없다(호출부가 넘긴 `mapper`의 부작용은 그대로 따른다). 결과 배열은 완료
 * 순서가 아니라 `items`와 같은 순서로 채워진다.
 */
export async function mapWithConcurrencyLimit<T, R>(
  items: readonly T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current]!, current);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
