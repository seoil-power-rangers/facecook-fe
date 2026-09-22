import {
  normalizeAdminMissionsResponse,
  type AdminMissionExcludedItem,
  type AdminMissionListItem,
  type AdminMissionsListResult,
} from "./adminMissionsResponse";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

interface ProfileNameResponse {
  userId: number;
  nickname: string;
}

export interface AdminStatsResponse {
  totalUsers: number;
  activeToday: number;
  totalCooks: number;
  totalMatches: number;
  missionCleared: number;
  pendingReports: number;
}

export type AdminMissionResponse = AdminMissionListItem;
export type AdminMissionExcludedResponse = AdminMissionExcludedItem;
export type AdminMissionsResponse = AdminMissionsListResult;

export type AdminReportStatus = "pending" | "reviewed";

export interface AdminReportResponse {
  reportId: number;
  reporterId: number;
  reportedUserId: number;
  reason: string;
  detail: string | null;
  status: AdminReportStatus;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface AdminReportChatMessageResponse {
  messageId: number;
  matchId: number;
  senderId: number;
  content: string;
  sentAt: string;
}

export class AdminApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

/**
 * BE가 확인받은 STEP과 서버의 현재 STEP이 달라 완료 처리를 거절했는지 확인한다(409).
 *
 * BE #88이 이 상황에 어떤 `code` 문자열을 붙일지는 아직 정해지지 않았다(같은 저장소의
 * 다른 409들도 `ALREADY_REJECTED`처럼 상황마다 다른 이름을 쓴다) — 문자열 코드로 분기하면
 * BE가 실제로 배포한 코드와 어긋날 위험이 있으므로, 코드와 무관하게 HTTP 상태만으로 판단한다.
 */
export function isMissionStepConflict(error: unknown): boolean {
  return error instanceof AdminApiError && error.status === 409;
}

export function adminErrorMessage(error: unknown) {
  if (error instanceof AdminApiError) {
    if (error.code === "UNAUTHORIZED") {
      return "관리자 세션이 필요합니다. 관리자 계정으로 다시 로그인해주세요.";
    }
    if (error.code === "FORBIDDEN") {
      return "관리자 권한이 없는 계정입니다.";
    }
    if (error.code === "SUSPENDED") {
      return "정지된 계정으로는 관리자 기능을 사용할 수 없습니다.";
    }
    return error.message;
  }
  return "백엔드 서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.";
}

export function getAdminStats() {
  return requestAdmin<AdminStatsResponse>("/api/admin/stats");
}

/**
 * 관리자 미션 목록을 가져온다. 서버가 아직은 배열만 돌려주지만(빠진 매칭은
 * 서버 로그로만 남는다), 앞으로 `{items, excluded}` 객체로 바뀌면(BE #86) 배정
 * 실패 등으로 빠진 매칭을 `excluded`로 함께 받아 화면에 보여줄 수 있다.
 * `includeExcluded=true`를 미리 보내 두면, 서버가 그 값을 아직 모를 때는
 * 무시하고(지금과 동일한 배열 응답), 지원하기 시작하면 별도 배포 없이
 * `excluded`를 채워 보내준다.
 */
export async function getAdminMissions() {
  const raw = await requestAdmin<unknown>("/api/admin/missions?includeExcluded=true");
  try {
    return normalizeAdminMissionsResponse(raw);
  } catch {
    throw new AdminApiError(
      "INVALID_RESPONSE",
      "관리자 미션 응답 형식이 예상과 달라요. 서버 배포 상태를 확인해주세요.",
    );
  }
}

/**
 * matchId의 현재 STEP을 완료 처리한다. `expectedStep`은 관리자가 확인 시트에서 본
 * STEP을 그대로 보낸다(요청 시점에 다시 계산하지 않는다) — 서버가 그 사이 다른
 * 요청으로 이미 다음 STEP으로 넘어갔으면 이 값과 서버의 현재 STEP이 달라 409로
 * 거절된다({@link isMissionStepConflict}로 구분).
 */
export function completeAdminMission(matchId: number, expectedStep: number) {
  return requestAdmin<AdminMissionResponse>(
    `/api/admin/missions/${matchId}/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedStep }),
    },
  );
}

export function getAdminReports() {
  return requestAdmin<AdminReportResponse[]>("/api/admin/reports");
}

export function getAdminReport(reportId: number) {
  return requestAdmin<AdminReportResponse>(`/api/admin/reports/${reportId}`);
}

export function resolveAdminReport(reportId: number, suspend: boolean) {
  return requestAdmin<AdminReportResponse>(
    `/api/admin/reports/${reportId}/resolve`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspend }),
    },
  );
}

export function getAdminReportChat(reportId: number) {
  return requestAdmin<AdminReportChatMessageResponse[]>(
    `/api/admin/reports/${reportId}/chat`,
  );
}

export async function getAdminUserNames(userIds: number[]) {
  const uniqueIds = [...new Set(userIds)];
  const entries = await Promise.all(
    uniqueIds.map(async (userId) => {
      try {
        const profile = await requestAdmin<ProfileNameResponse>(
          `/api/profiles/${userId}`,
        );
        return [userId, profile.nickname] as const;
      } catch {
        return [userId, `참가자 #${userId}`] as const;
      }
    }),
  );
  return Object.fromEntries(entries) as Record<number, string>;
}

function requireApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new AdminApiError(
      "MISSING_API_BASE_URL",
      "NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }
  return API_BASE_URL;
}

async function requestAdmin<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${requireApiBaseUrl()}${path}`, {
      ...init,
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof AdminApiError) throw error;
    throw new AdminApiError("NETWORK", "백엔드 서버에 연결할 수 없습니다.");
  }

  const payload = (await response.json().catch(() => ({}))) as T &
    ApiErrorResponse;
  if (!response.ok) {
    throw new AdminApiError(
      payload.code ?? "UNKNOWN",
      payload.message ?? "관리자 요청을 처리하지 못했습니다.",
      response.status,
    );
  }
  return payload;
}
