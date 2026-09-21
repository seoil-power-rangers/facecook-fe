import { createApiRequest } from "@ui/공통/apiClient";

export interface ChatMessageResponse {
  messageId: number;
  matchId: number;
  senderId: number;
  content: string;
  clientMessageId: string;
  sentAt: string;
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

const requestChat = createApiRequest({
  makeError: (code, message) => new ChatApiError(code, message),
});
