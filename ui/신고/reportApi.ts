import { createApiRequest } from "@ui/공통/apiClient";

export interface CreateReportRequest {
  reportedUserId: number;
  reason: string;
  detail?: string;
}

export interface ReportResponse {
  reportId: number;
  reporterId: number;
  reportedUserId: number;
  reason: string;
  detail: string | null;
  status: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
}

export class ReportApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ReportApiError";
  }
}

export function reportErrorMessage(error: unknown) {
  if (error instanceof ReportApiError) {
    if (error.code === "UNAUTHORIZED") {
      return "로그인이 만료됐어요. 다시 로그인해주세요.";
    }
    if (error.code === "NOT_FOUND") {
      return "신고 대상 사용자를 찾을 수 없어요.";
    }
    return error.message;
  }
  return "백엔드 서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.";
}

export function createReport(request: CreateReportRequest) {
  return requestReport<ReportResponse>("/api/reports", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

const requestReport = createApiRequest({
  makeError: (code, message) => new ReportApiError(code, message),
  fallbackMessage: "신고를 접수하지 못했습니다.",
});
