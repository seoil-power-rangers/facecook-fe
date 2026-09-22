export interface AdminMissionListItem {
  matchId: number;
  userAId: number;
  userBId: number;
  matchedAt: string;
  currentStep: number;
  step1Mission: string;
  step2Mission: string;
  step3Mission: string;
  step1CompletedAt: string | null;
  step1CompletedBy: number | null;
  step2CompletedAt: string | null;
  step2CompletedBy: number | null;
  step3CompletedAt: string | null;
  step3CompletedBy: number | null;
}

export interface AdminMissionExcludedItem {
  matchId: number;
  reason?: string | null;
}

export interface AdminMissionsListResult {
  items: AdminMissionListItem[];
  excluded: AdminMissionExcludedItem[];
}

/**
 * `/api/admin/missions` 응답을 `{items, excluded}` 형태로 통일한다.
 *
 * 지금 서버는 배열만 돌려주지만(배정 실패한 매칭은 서버 로그로만 남고 조용히
 * 빠진다), 앞으로 `{items, excluded}` 객체로 바꿔 빠진 매칭을 화면에서도 보여줄
 * 예정이다(BE #86). 이 함수가 두 응답 모양을 모두 흡수해서, 화면 코드는 서버가
 * 언제 객체 응답으로 바뀌든 그대로 동작한다.
 *
 * 전제조건: 없음 — 어떤 값이 와도 던지지 않고 최대한 안전하게 해석한다.
 *
 * 부작용: 없다.
 */
export function normalizeAdminMissionsResponse(raw: unknown): AdminMissionsListResult {
  if (Array.isArray(raw)) {
    return { items: raw as AdminMissionListItem[], excluded: [] };
  }
  if (raw && typeof raw === "object" && "items" in raw) {
    const candidate = raw as { items?: unknown; excluded?: unknown };
    return {
      items: Array.isArray(candidate.items) ? (candidate.items as AdminMissionListItem[]) : [],
      excluded: Array.isArray(candidate.excluded)
        ? (candidate.excluded as AdminMissionExcludedItem[])
        : [],
    };
  }
  return { items: [], excluded: [] };
}
