"use client";

import { useCallback, useSyncExternalStore } from "react";
import { EMPTY_DRAFT, type OnboardingDraft } from "./types";

const STORAGE_KEY = "facecook:onboarding";

/**
 * 온보딩 02~07의 입력값을 담아두는 곳.
 *
 * React 밖에 두고 useSyncExternalStore로 읽는다. 서버에서는 빈 값을 그리고,
 * 브라우저로 넘어온 뒤 sessionStorage에 남은 값으로 바뀐다 —
 * 부스에서 폰 화면이 꺼졌다 돌아와도 입력한 게 남아 있게 하려는 것.
 */
let draft: OnboardingDraft = EMPTY_DRAFT;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) draft = { ...EMPTY_DRAFT, ...JSON.parse(saved) };
  } catch {
    // 시크릿 모드 등에서 막히면 빈 값으로 시작한다.
  }
}

function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // 저장 실패는 무시 — 화면 진행까지 막을 일은 아니다.
  }
}

function publish() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot() {
  load();
  return draft;
}

function getServerSnapshot() {
  return EMPTY_DRAFT;
}

export function useOnboarding() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const set = useCallback(
    <K extends keyof OnboardingDraft>(key: K, next: OnboardingDraft[K]) => {
      draft = { ...draft, [key]: next };
      save();
      publish();
    },
    [],
  );

  /**
   * 이전 값을 읽어서 고쳐야 할 때 쓴다(토글 등).
   * set()은 렌더 시점의 값을 복사하므로 연타하면 앞선 변경이 덮인다.
   */
  const update = useCallback(
    (change: (prev: OnboardingDraft) => OnboardingDraft) => {
      draft = change(draft);
      save();
      publish();
    },
    [],
  );

  const reset = useCallback(() => {
    draft = EMPTY_DRAFT;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }
    publish();
  }, []);

  return { draft: value, set, update, reset };
}
