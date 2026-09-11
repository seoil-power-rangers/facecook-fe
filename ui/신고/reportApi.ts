const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

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

function requireApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new ReportApiError(
      "MISSING_API_BASE_URL",
      "NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }
  return API_BASE_URL;
}

async function requestReport<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${requireApiBaseUrl()}${path}`, {
      ...init,
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof ReportApiError) {
      throw error;
    }
    throw new ReportApiError("NETWORK", "백엔드 서버에 연결할 수 없습니다.");
  }

  const payload = (await response.json().catch(() => ({}))) as T &
    ApiErrorResponse;

  if (!response.ok) {
    throw new ReportApiError(
      payload.code ?? "UNKNOWN",
      payload.message ?? "신고를 접수하지 못했습니다.",
    );
  }

  return payload;
}
