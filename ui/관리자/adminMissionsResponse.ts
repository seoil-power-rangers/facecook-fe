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

/** 서버 응답이 두 허용된 모양(배열, `{items, excluded}` 객체) 중 어느 것도 아닐 때 던진다. */
export class AdminMissionsResponseShapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminMissionsResponseShapeError";
  }
}

/**
 * `/api/admin/missions` 응답을 `{items, excluded}` 형태로 통일한다.
 *
 * 지금 서버는 배열만 돌려주지만(배정 실패한 매칭은 서버 로그로만 남고 조용히
 * 빠진다), 앞으로 `{items, excluded}` 객체로 바꿔 빠진 매칭을 화면에서도 보여줄
 * 예정이다(BE #86). 이 함수가 두 응답 모양을 모두 흡수해서, 화면 코드는 서버가
 * 언제 객체 응답으로 바뀌든 그대로 동작한다.
 *
 * 전제조건: 없음.
 *
 * 부작용: 없다.
 *
 * 예외: 배열도 아니고 `items`가 배열인 객체도 아니면(예: `null`, 다른 형태의
 * 객체), 또는 `excluded`가 있는데 배열이 아니면 {@link AdminMissionsResponseShapeError}를
 * 던진다 — 계약이 깨진 걸 빈 목록으로 감추면 관리자가 "매칭이 없다"로 오인하고,
 * 이 PR의 핵심인 제외 매칭 알림도 조용히 사라지기 때문에 여기서는 실패시킨다.
 */
export function normalizeAdminMissionsResponse(raw: unknown): AdminMissionsListResult {
  if (Array.isArray(raw)) {
    return { items: raw as AdminMissionListItem[], excluded: [] };
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)) {
    const candidate = raw as { items: unknown[]; excluded?: unknown };
    if (candidate.excluded !== undefined && !Array.isArray(candidate.excluded)) {
      throw new AdminMissionsResponseShapeError(
        "관리자 미션 응답의 excluded가 배열이 아닙니다.",
      );
    }
    return {
      items: candidate.items as AdminMissionListItem[],
      excluded: (candidate.excluded ?? []) as AdminMissionExcludedItem[],
    };
  }
  throw new AdminMissionsResponseShapeError("관리자 미션 응답 형식을 알 수 없습니다.");
}
