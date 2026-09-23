const SEED_KEY = "facecook:explore:seed";

/**
 * 세션 안에서 탐색 정렬에 쓸 시드를 하나 정해 `sessionStorage`에 저장해 둔다. 이미 저장된
 * 값이 있으면 그대로 쓴다 — 정렬 함수 자체(`exploreSort.ts`)는 이 저장소를 몰라도 되도록,
 * 시드를 구하는 부작용을 이 함수 하나로 좁혀 뒀다.
 *
 * 전제조건: 없음.
 *
 * 부작용: `sessionStorage`를 읽고, 값이 없으면 새로 만들어 쓴다.
 *
 * 저장이 막히면(시크릿 모드, iOS 저장공간 정리 등) 세션 내내 순서를 고정할 수는 없다.
 * 다만 모두에게 똑같은 값을 쓰면 그 사람들 사이에서 다시 "앞줄만 콕을 받는" 쏠림이
 * 재발하므로, 최소한 사람마다는 다른 값이 되도록 호출부가 넘긴 `fallbackSeed`(보는
 * 사람 자신의 userId)를 대신 쓴다.
 */
export function resolveSessionSeed(fallbackSeed: number): number {
  try {
    const saved = sessionStorage.getItem(SEED_KEY);
    if (saved) return Number(saved);
    const seed = Math.floor(Math.random() * 2 ** 31);
    sessionStorage.setItem(SEED_KEY, String(seed));
    return seed;
  } catch {
    return fallbackSeed;
  }
}
