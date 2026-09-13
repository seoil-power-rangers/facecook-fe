"use client";

import { useEffect } from "react";
import { startCapturingInstallPrompt } from "./pwaInstall";

const SERVICE_WORKER_PATH = "/push-sw.js";

/**
 * "홈 화면에 추가"가 되게 만드는 것들을 앱 진입 시점에 건다. 화면은 그리지 않는다.
 *
 *  1. 서비스워커 등록 — 원래는 마이페이지에서 푸시 알림을 켤 때만 등록했는데,
 *     그러면 브라우저가 설치 조건을 만족했다고 보지 않는다. 알림을 켜지 않은
 *     사람도 설치할 수 있어야 해서 여기로 끌어올렸다.
 *  2. beforeinstallprompt 수신 — 마이페이지가 열리기 전에 오는 이벤트라
 *     화면 컴포넌트에서 받으면 놓친다.
 *  3. 영구 저장소 요청 — 아이폰에서 홈 화면에 추가해 쓰다가 앱 스위처에서
 *     완전히 지우면 iOS가 저장공간 압박 시 로그인 쿠키까지 같이 날려버리는
 *     경우가 있다. 100% 막을 수는 없지만, 브라우저에 "이 사이트 데이터는
 *     지우지 말아달라"고 미리 요청해두면 지워질 확률이 줄어든다.
 */
export function PwaBootstrap() {
  useEffect(() => {
    startCapturingInstallPrompt();

    if ("storage" in navigator && "persist" in navigator.storage) {
      void navigator.storage.persist().catch(() => {
        // 지원 안 하거나 거부돼도 앱 사용 자체엔 지장 없다.
      });
    }

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
