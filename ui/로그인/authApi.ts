const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL 환경변수가 필요합니다.");
}

type VerificationPurpose = "signup" | "login";

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export interface RequestCodeResponse {
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface AuthVerificationResponse {
  userId: number;
  email: string;
  role: "participant" | "admin";
}

export class AuthApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

export function requestCode(email: string, purpose: VerificationPurpose) {
  return post<RequestCodeResponse>("/api/auth/request-code", {
    email: email.trim(),
    purpose,
  });
}

export function verifySignup(
  email: string,
  code: string,
  agreedTerms: string[],
) {
  return post<AuthVerificationResponse>("/api/auth/verify-signup", {
    email: email.trim(),
    code,
    agreedTerms,
  });
}

export function verifyLogin(email: string, code: string) {
  return post<AuthVerificationResponse>("/api/auth/verify-login", {
    email: email.trim(),
    code,
  });
}

/** 세션 쿠키는 HttpOnly라 여기서 지우는 게 아니라 BE 응답의 Set-Cookie로 지워진다. */
export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new AuthApiError("LOGOUT_FAILED", "로그아웃 요청을 처리하지 못했습니다.");
  }
}

export function authErrorMessage(error: unknown) {
  if (error instanceof AuthApiError) {
    return error.message;
  }
  return "백엔드 서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.";
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthApiError("NETWORK", "백엔드 서버에 연결할 수 없습니다.");
  }

  const payload = (await response.json().catch(() => ({}))) as T &
    ApiErrorResponse;

  if (!response.ok) {
    throw new AuthApiError(
      payload.code ?? "UNKNOWN",
      payload.message ?? "요청을 처리하지 못했습니다.",
    );
  }

  return payload;
}
