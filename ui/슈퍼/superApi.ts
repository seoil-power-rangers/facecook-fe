const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export interface SuperUserResponse {
  userId: number;
  email: string;
  role: string;
  status: string;
  createdAt: string | null;
  lastActiveAt: string | null;
  nickname: string | null;
  gender: string | null;
  age: number | null;
  mbti: string | null;
  hobby: string | null;
  bloodType: string | null;
  department: string | null;
  grade: string | null;
  bio: string | null;
  idealType: string | null;
  photo: string | null;
}

export interface SuperChatMemberResponse {
  userId: number;
  email: string | null;
  nickname: string | null;
  gender: string | null;
  photo: string | null;
}

export interface SuperChatRoomResponse {
  matchId: number;
  matchedAt: string;
  userA: SuperChatMemberResponse;
  userB: SuperChatMemberResponse;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export interface SuperChatMessageResponse {
  messageId: number;
  matchId: number;
  senderId: number;
  content: string;
  sentAt: string;
}

export class SuperApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SuperApiError";
  }
}

export function superErrorMessage(error: unknown) {
  if (error instanceof SuperApiError) {
    if (error.code === "UNAUTHORIZED") {
      return "다시 로그인해주세요.";
    }
    if (error.code === "FORBIDDEN") {
      return "슈퍼 권한이 없는 계정입니다.";
    }
    return error.message;
  }
  return "백엔드 서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.";
}

export function getSuperUsers() {
  return requestSuper<SuperUserResponse[]>("/api/super/users");
}

export function getSuperChats() {
  return requestSuper<SuperChatRoomResponse[]>("/api/super/chats");
}

export function getSuperChatMessages(
  matchId: number,
  options: { before?: number; limit?: number } = {},
) {
  const query = new URLSearchParams();
  if (options.before !== undefined) query.set("before", String(options.before));
  query.set("limit", String(options.limit ?? 50));

  return requestSuper<SuperChatMessageResponse[]>(
    `/api/super/chats/${matchId}/messages?${query.toString()}`,
  );
}

function requireApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new SuperApiError(
      "MISSING_API_BASE_URL",
      "NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }
  return API_BASE_URL;
}

async function requestSuper<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${requireApiBaseUrl()}${path}`, {
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof SuperApiError) throw error;
    throw new SuperApiError("NETWORK", "백엔드 서버에 연결할 수 없습니다.");
  }

  const payload = (await response.json().catch(() => ({}))) as T &
    ApiErrorResponse;
  if (!response.ok) {
    throw new SuperApiError(
      payload.code ?? "UNKNOWN",
      payload.message ?? "요청을 처리하지 못했습니다.",
    );
  }
  return payload;
}
