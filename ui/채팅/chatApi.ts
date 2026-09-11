const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export interface ChatMessageResponse {
  messageId: number;
  matchId: number;
  senderId: number;
  content: string;
  clientMessageId: string;
  sentAt: string;
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export class ChatApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ChatApiError";
  }
}

const CHAT_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "로그인이 만료됐어요. 다시 로그인해주세요.",
  FORBIDDEN: "이 채팅방에 접근할 수 없어요.",
  NOT_FOUND: "채팅방을 찾을 수 없어요.",
  CLOSED: "채팅 운영시간이 끝났어요. 내일 09:00에 다시 이용해주세요.",
};

export function chatErrorMessage(error: unknown) {
  if (error instanceof ChatApiError) {
    return CHAT_ERROR_MESSAGES[error.code] ?? error.message;
  }
  return "백엔드 서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.";
}

export function getChatMessages(
  matchId: number,
  options: { before?: number; limit?: number } = {},
) {
  const query = new URLSearchParams();
  if (options.before !== undefined) query.set("before", String(options.before));
  query.set("limit", String(options.limit ?? 50));

  return requestChat<ChatMessageResponse[]>(
    `/api/matches/${matchId}/messages?${query.toString()}`,
  );
}

function requireApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new ChatApiError(
      "MISSING_API_BASE_URL",
      "NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }
  return API_BASE_URL;
}

async function requestChat<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${requireApiBaseUrl()}${path}`, {
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof ChatApiError) throw error;
    throw new ChatApiError("NETWORK", "백엔드 서버에 연결할 수 없습니다.");
  }

  const payload = (await response.json().catch(() => ({}))) as T &
    ApiErrorResponse;

  if (!response.ok) {
    throw new ChatApiError(
      payload.code ?? "UNKNOWN",
      payload.message ?? "요청을 처리하지 못했습니다.",
    );
  }

  return payload;
}
