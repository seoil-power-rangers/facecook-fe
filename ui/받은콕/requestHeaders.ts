/**
 * 요청 헤더를 만든다. 호출부가 넘긴 헤더(예: 거절 요청의 `X-Cook-Reject-Contract`)를 지우지 않고,
 * 본문이 있을 때만 `Content-Type: application/json`을 채운다.
 *
 * 전제조건: `initHeaders`는 fetch가 받는 어떤 형태(객체, 배열, `Headers`)여도 된다.
 *
 * 부작용: 없다(새 `Headers`를 만들어 돌려준다).
 */
export function buildRequestHeaders(initHeaders: HeadersInit | undefined, hasBody: boolean): Headers {
  const headers = new Headers(initHeaders);
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}
