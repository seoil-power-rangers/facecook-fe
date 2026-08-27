"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "facecook:session";

export type SessionRole = "guest" | "participant" | "admin";

export interface Session {
  role: SessionRole;
  /** 화면에 표시할 이름. 관리자는 로그인 아이디를 그대로 쓴다. */
  name: string;
}

const EMPTY_SESSION: Session = { role: "guest", name: "" };

/**
 * 로그인 상태를 담아두는 곳. onboarding.tsx와 같은 방식으로 React 밖에 둔다.
 *
 * 지금은 브라우저 안에서만 도는 목업이다 — 아이디·비밀번호를 서버에 확인하지
 * 않으므로 진짜 인증이 아니다. 서버가 붙으면 signIn()의 내용만 실제 조회로
 * 바꾸면 되도록 이 파일 한 군데에 모아둔다.
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
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      session = { ...EMPTY_SESSION, ...JSON.parse(saved) };
    }
  } catch {
    // 시크릿 모드 등에서 막히면 비로그인으로 시작한다.
  }
}

function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
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

export function useSession() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const signIn = useCallback((next: Session) => {
    session = next;
    save();
    publish();
  }, []);

  const signOut = useCallback(() => {
    session = EMPTY_SESSION;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }
    publish();
  }, []);

  return { session: value, signIn, signOut };
}
