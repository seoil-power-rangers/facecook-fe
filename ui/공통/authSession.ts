import { clearSession } from "./session";

const NOTICE_KEY = "facecook:authNotice";

/**
 * 세션 만료·정지는 화면마다 따로 감지하면 놓치는 경로가 생긴다 — 최초
 * 진입이 아니라 화면에 머무는 중에 걸린 API 호출에서도 똑같이 튕겨나가야
 * 하므로, 이를 감지하는 모든 API 모듈(profileApi, cookApi 등)이 이 함수
 * 하나로 모여 로그인 화면으로 보낸다.
 *
 * React 라우터가 아니라 location을 직접 바꾸는 이유: 이 함수는 컴포넌트
 * 트리 밖(순수 fetch 래퍼)에서도 호출되므로 router 인스턴스를 들고 있을
 * 수 없다.
 */
export function redirectToLoginOnSignOut(message?: string) {
  if (typeof window === "undefined") return;
  try {
    if (message) sessionStorage.setItem(NOTICE_KEY, message);
  } catch {
    // 저장이 막혀도 리다이렉트 자체는 진행한다.
  }
  // 로그인 화면이 남은 이름표를 보고 다시 안으로 들여보내지 않도록 같이 지운다.
  clearSession();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

/** 로그인 화면이 한 번 읽으면 사라진다 — 새로고침해도 같은 안내가 반복되지 않는다. */
export function takeAuthNotice(): string | null {
  try {
    const message = sessionStorage.getItem(NOTICE_KEY);
    if (message) sessionStorage.removeItem(NOTICE_KEY);
    return message;
  } catch {
    return null;
  }
}
