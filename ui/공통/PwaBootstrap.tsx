"use client";

import { useEffect } from "react";
import { startCapturingInstallPrompt } from "./pwaInstall";

const SERVICE_WORKER_PATH = "/push-sw.js";

/**
 * "홈 화면에 추가"가 되게 만드는 두 가지를 앱 진입 시점에 건다. 화면은 그리지 않는다.
 *
 *  1. 서비스워커 등록 — 원래는 마이페이지에서 푸시 알림을 켤 때만 등록했는데,
 *     그러면 브라우저가 설치 조건을 만족했다고 보지 않는다. 알림을 켜지 않은
 *     사람도 설치할 수 있어야 해서 여기로 끌어올렸다.
 *  2. beforeinstallprompt 수신 — 마이페이지가 열리기 전에 오는 이벤트라
 *     화면 컴포넌트에서 받으면 놓친다.
 */
export function PwaBootstrap() {
  useEffect(() => {
    startCapturingInstallPrompt();

    if (!("serviceWorker" in navigator)) return;

    // 첫 화면 렌더와 경쟁하지 않도록 load 이후로 미룬다.
    const register = () => {
      void navigator.serviceWorker.register(SERVICE_WORKER_PATH).catch(() => {
        // 등록 실패는 설치·알림만 못 쓰게 될 뿐이라 화면 진행은 막지 않는다.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => {
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
