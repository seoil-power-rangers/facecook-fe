import type { ExploreFilters } from "./FilterSheet";

export interface ExploreReturnState {
  viewerId: number;
  filters: ExploreFilters;
  visibleCount: number;
  anchorUserId: number;
  anchorTop: number;
  scrollTop: number;
}

// 같은 브라우저 탭에서 상세 프로필을 닫고 돌아올 때 한 번만 복원한다.
let pending: ExploreReturnState | null = null;

export function saveExploreReturnState(state: ExploreReturnState): void {
  pending = state;
}

export function takeExploreReturnState(): ExploreReturnState | null {
  const state = pending;
  pending = null;
  return state;
}
