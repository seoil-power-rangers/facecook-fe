import { createApiRequest } from "@ui/공통/apiClient";

/** 후기 제출 실패. code는 BE 오류 코드(`VALIDATION`, `FEEDBACK_BUSY`) 또는 `NETWORK`. */
export class FeedbackApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "FeedbackApiError";
  }
}

const request = createApiRequest({
  makeError: (code, message) => new FeedbackApiError(code, message),
  fallbackMessage: "후기를 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
});

/** 익명 후기 저장(`POST /api/feedback`). 로그인 없이 부르고, 성공하면 본문 없이 끝난다. */
export function submitFeedback(content: string) {
  return request<void>("/api/feedback", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function feedbackErrorMessage(error: unknown) {
  if (error instanceof FeedbackApiError) {
    if (error.code === "NETWORK") return "인터넷 연결을 확인하고 다시 보내 주세요.";
    return error.message;
  }
  return "후기를 보내지 못했어요. 잠시 후 다시 시도해 주세요.";
}
