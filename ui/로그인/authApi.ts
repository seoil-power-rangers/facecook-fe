// 이 값을 모듈 로드 시점에 검사(throw)하면 안 된다 — Next.js가 /login, /mypage를
// 빌드 시점에 정적 생성(prerender)하면서 이 모듈을 불러오기만 해도 그 검사가
// 실행되고, 배포 환경에 NEXT_PUBLIC_API_BASE_URL이 아직 없으면 빌드 자체가
// 깨진다. 실제로 호출하는 시점(런타임)에만 확인한다.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function requireApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new AuthApiError(
      "MISSING_API_BASE_URL",
      "NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }
  return API_BASE_URL;
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
  role: "participant" | "admin" | "super";
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
  password: string,
  agreedTerms: string[],
) {
  return post<AuthVerificationResponse>("/api/auth/verify-signup", {
    email: email.trim(),
    code,
    password,
    agreedTerms,
  });
}

export function login(email: string, password: string) {
  return post<AuthVerificationResponse>("/api/auth/login", {
    email: email.trim(),
    password,
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
  const response = await fetch(`${requireApiBaseUrl()}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new AuthApiError("LOGOUT_FAILED", "로그아웃 요청을 처리하지 못했습니다.");
  }
}

export function authErrorMessage(error: unknown) {
  if (error instanceof AuthApiError) {
    if (error.code === "INVALID_CREDENTIALS") {
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    }
    return error.message;
  }
  return "백엔드 서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.";
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = requireApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
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
