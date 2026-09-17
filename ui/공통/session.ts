"use client";

import { useCallback, useSyncExternalStore } from "react";
import { resetAnalytics } from "./analytics";

const STORAGE_KEY = "facecook:session";

export type SessionRole = "guest" | "participant" | "admin" | "super";

export interface Session {
  role: SessionRole;
  /** 화면에 표시할 이름. 관리자는 로그인 아이디를 그대로 쓴다. */
  name: string;
}

const EMPTY_SESSION: Session = { role: "guest", name: "" };

/**
 * 로그인한 사람의 이름표. onboarding.tsx와 같은 방식으로 React 밖에 둔다.
 *
 * 인증 자체는 여기 없다 — 서버가 준 HttpOnly 세션 쿠키가 하고, 그 쿠키는
 * JS가 읽을 수 없다. 여기 있는 건 화면에 이름을 띄우고 참가자/관리자를
 * 가르는 용도뿐이라, 지워져도 서버는 여전히 우리를 알아본다.
 *
 * localStorage에 두는 이유: 앱을 껐다 켜도 남아야 한다. sessionStorage는
 * 탭을 닫으면 지워져서, 쿠키가 멀쩡히 살아 있는데도 앱이 매번 로그인
 * 화면을 띄웠다.
 */
let session: Session = EMPTY_SESSION;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) {
    return;
  }
  loaded = true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      session = { ...EMPTY_SESSION, ...JSON.parse(saved) };
    }
  } catch {
    // 시크릿 모드 등에서 막히면 비로그인으로 시작한다.
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // 저장 실패는 무시 — 화면 진행까지 막을 일은 아니다.
  }
}

function publish() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot() {
  load();
  return session;
}

function getServerSnapshot() {
  return EMPTY_SESSION;
}

/**
 * 세션이 풀렸을 때 이름표를 지운다. fetch 래퍼(authSession)처럼 컴포넌트
 * 밖에서도 불러야 해서 훅이 아니라 일반 함수로 둔다.
 *
 * 이게 없으면 이름표만 남아, 로그인 화면이 그 이름표를 보고 다시 /main으로
 * 보내고 → 거기서 또 튕겨나오는 왕복이 생긴다.
 */
export function clearSession() {
  session = EMPTY_SESSION;
  // 로그 수집의 사람 식별도 같이 끊는다 — 부스에서 같은 폰을 다음 사람이
  // 쓸 때 이전 사용자의 여정에 이어붙지 않게 한다.
  resetAnalytics();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
  publish();
}

export function useSession() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const signIn = useCallback((next: Session) => {
    session = next;
    save();
    publish();
  }, []);

  const signOut = useCallback(() => {
    session = EMPTY_SESSION;
    resetAnalytics();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }
    publish();
  }, []);

  return { session: value, signIn, signOut };
}
