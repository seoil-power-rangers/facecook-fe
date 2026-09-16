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

export interface AdminMissionResponse {
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
  ) {
    super(message);
    this.name = "AdminApiError";
  }
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

export function getAdminMissions() {
  return requestAdmin<AdminMissionResponse[]>("/api/admin/missions");
}

export function completeAdminMission(matchId: number) {
  return requestAdmin<AdminMissionResponse>(
    `/api/admin/missions/${matchId}/complete`,
    { method: "POST" },
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
    );
  }
  return payload;
}
