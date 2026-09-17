"use client";

import { useCallback, useSyncExternalStore } from "react";
import { track } from "./analytics";

/**
 * "홈 화면에 추가" 상태를 담아두는 곳. session.ts와 같은 방식으로 React 밖에 둔다.
 *
 * 브라우저가 설치 조건을 다 확인하면 beforeinstallprompt를 한 번 쏘는데, 그게
 * 화면 컴포넌트가 붙기 전에 올 수 있다. 그래서 이벤트를 여기서 받아 들고 있다가
 * 나중에 버튼을 눌렀을 때 꺼내 쓴다.
 *
 * 사파리(아이폰)는 이 이벤트 자체가 없다 — 공유 버튼으로 직접 추가하는 수밖에
 * 없어서 안내 문구만 띄운다.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export type PwaInstallState =
  /** 이미 설치돼서 홈 화면 앱으로 실행 중 */
  | "installed"
  /** 설치 프롬프트를 띄울 수 있음 */
  | "available"
  /** 아이폰 사파리 — 공유 → 홈 화면에 추가 안내가 필요 */
  | "manual"
  /** 설치를 지원하지 않거나 조건이 아직 안 맞음 */
  | "unavailable";

let state: PwaInstallState = "unavailable";
let deferred: BeforeInstallPromptEvent | null = null;
let started = false;
const listeners = new Set<() => void>();

function isStandalone() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // 아이폰 사파리는 display-mode 대신 navigator.standalone으로 알려준다.
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // 아이패드(iPadOS 13+)는 자신을 맥이라고 한다. 터치 지원 여부로 가른다.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

function resolveState(): PwaInstallState {
  if (isStandalone()) return "installed";
  if (deferred) return "available";
  if (isIos()) return "manual";
  return "unavailable";
}

function publish(next: PwaInstallState) {
  if (next === state) return;
  state = next;
  for (const listener of listeners) {
    listener();
  }
}

/**
 * beforeinstallprompt를 받기 시작한다. 앱 진입 시점에 PwaBootstrap이 한 번 부른다.
 * 화면 컴포넌트가 붙은 뒤에 걸면 이벤트를 놓친다.
 */
export function startCapturingInstallPrompt() {
  if (started || typeof window === "undefined") return;
  started = true;
  state = resolveState();
  // 아이폰 웹푸시는 설치를 전제로 해서, 이 분포가 곧 알림 도달률의 상한이다.
  track({ name: "pwa_install_state", props: { state } });

  window.addEventListener("beforeinstallprompt", (event) => {
    // 기본 미니 배너를 막고 우리 버튼으로 띄운다.
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    publish(resolveState());
  });

  window.addEventListener("appinstalled", () => {
    deferred = null;
    publish("installed");
  });
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot() {
  return state;
}

function getServerSnapshot(): PwaInstallState {
  return "unavailable";
}

export function usePwaInstall() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /**
   * 설치 프롬프트를 띄운다. 한 번 쓴 이벤트는 재사용할 수 없어서 비우고,
   * 사용자가 거절하면 브라우저가 나중에 다시 쏠 때까지 버튼이 사라진다.
   */
  const promptInstall = useCallback(async () => {
    const event = deferred;
    if (!event) return "unavailable" as const;

    deferred = null;
    await event.prompt();
    const { outcome } = await event.userChoice;
    track({ name: "pwa_install_result", props: { outcome } });
    publish(outcome === "accepted" ? "installed" : resolveState());
    return outcome;
  }, []);

  return { installState: value, promptInstall };
}
