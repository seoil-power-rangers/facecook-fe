/**
 * 백엔드에 요청을 보내는 공통 뼈대.
 *
 * 화면 폴더마다 *Api.ts가 있고, 그 안의 request 함수들이 거의 같은 코드를
 * 열 번 반복하고 있었다 — 주소 조립, credentials, JSON 파싱, 실패 코드 꺼내기,
 * 네트워크 끊김을 NETWORK로 바꾸기. 고칠 일이 생기면 열 곳을 같이 고쳐야 하고,
 * 실제로 한 곳만 고쳐져서 어긋난 적이 있다(204 응답 처리는 cookApi에만 있었다).
 *
 * 오류 클래스는 모듈마다 그대로 둔다. 화면이 instanceof로 가려내고 있어서
 * 한 종류로 합치면 "이 오류가 어느 화면 것인지"를 잃는다. 여기서는 만드는
 * 방법만 받아서 쓴다.
 */

interface ApiErrorPayload {
  code?: string;
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export interface ApiClientOptions<E extends Error> {
  /** 모듈의 오류 클래스를 만드는 방법. status는 401 판별에 쓰는 쪽만 받는다. */
  makeError: (code: string, message: string, status: number) => E;
  /** 응답에 message가 없을 때 쓸 문구. */
  fallbackMessage?: string;
  /**
   * 세션이 끊긴 응답을 만났을 때 할 일. 로그인 화면으로 보내는 모듈만 넘긴다 —
   * 관리자 조회처럼 화면에서 직접 다루는 쪽은 넘기지 않는다.
   */
  onSignedOut?: (code: string, message: string, status: number) => void;
}

/**
 * 모듈 전용 request 함수를 만든다.
 *
 * 204는 본문이 없으므로 파싱하지 않고 undefined를 돌려준다. 거절처럼 돌려줄
 * 값이 없는 요청이 여기 해당한다 — 파싱하려 들면 빈 본문에서 던진다.
 */
export function createApiRequest<E extends Error>({
  makeError,
  fallbackMessage = "요청을 처리하지 못했습니다.",
  onSignedOut,
}: ApiClientOptions<E>) {
  return async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!API_BASE_URL) {
      throw makeError(
        "MISSING_API_BASE_URL",
        "NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.",
        0,
      );
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: withJsonContentType(init),
        credentials: "include",
      });
    } catch {
      throw makeError("NETWORK", "백엔드 서버에 연결할 수 없습니다.", 0);
    }

    if (response.status === 204) return undefined as T;

    const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;

    if (!response.ok) {
      const code = payload.code ?? "UNKNOWN";
      const message = payload.message ?? fallbackMessage;
      onSignedOut?.(code, message, response.status);
      throw makeError(code, message, response.status);
    }

    return payload;
  };
}

/**
 * 본문이 있으면 JSON이라고 알린다. 안 붙이면 서버가 본문을 읽지 못한다.
 *
 * 호출부가 직접 넘긴 헤더가 있으면 그대로 둔다 — 콕 거절처럼 계약 버전을
 * 따로 붙이는 요청이 있어서, 여기서 덮어쓰면 그 헤더가 사라진다.
 */
function withJsonContentType(init: RequestInit) {
  if (!init.body) return init.headers;
  return { "Content-Type": "application/json", ...toHeaderRecord(init.headers) };
}

function toHeaderRecord(headers: RequestInit["headers"]): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers;
}

/** 세션이 끊긴 응답인지. 401과 서버가 붙여 보내는 코드를 함께 본다. */
export function isSignedOutResponse(code: string, status: number) {
  return status === 401 || code === "UNAUTHORIZED" || code === "SUSPENDED";
}
