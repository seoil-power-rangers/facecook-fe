"use client";

import { useEffect } from "react";
import {
  SERVICE_ENDED_PATH,
  SERVICE_END_STATUS_PATH,
  WATCH_POLL_MS,
  goToServiceEnded,
  nextCheckDelayMs,
  type ServiceEndStatus,
} from "./serviceEnd";

/**
 * 열려 있는 화면을 종료 시각에 종료 화면으로 옮긴다(facecook-fe#127). 화면은 그리지 않는다.
 *
 * API 응답(`SERVICE_ENDED`)만 기다리면 아무것도 누르지 않은 로그인 화면이나 소켓만 기다리는 미션 화면은
 * 그대로 남는다. 그래서 서버(proxy)에 종료 여부와 남은 시간을 묻고, 남은 시간만큼 기다렸다가 다시 묻는다.
 *
 * 휴대폰 시계는 쓰지 않는다. 시계가 빠르면 운영 중에 넘어가고, 느리면 종료 뒤에도 남는다. 기다리는 시간(setTimeout)은
 * 휴대폰 시계와 관계없이 흐르므로 서버가 알려 준 남은 시간으로 정각에 다시 물을 수 있다.
 */
export function ServiceEndWatcher() {
  useEffect(() => {
    let stopped = false;
    let checking = false;
    let lastCheckedAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      if (stopped || checking || window.location.pathname === SERVICE_ENDED_PATH) return;
      checking = true;
      clearTimeout(timer);
      // 앱 복귀 때 너무 자주 묻지 않게 쓰는 간격 계산용이다. 차이만 보므로 휴대폰 시계가 틀려도 상관없다.
      lastCheckedAt = Date.now();
      const status = await askServer();
      checking = false;
      if (stopped) return;
      if (status?.ended) {
        goToServiceEnded();
        return;
      }
      // 종료 시각이 정해지지 않았으면 더 묻지 않는다. 물어보지 못했으면 잠시 뒤 다시 묻는다.
      if (status && status.remainingMs === null) return;
      const delay = status?.remainingMs != null ? nextCheckDelayMs(status.remainingMs) : WATCH_POLL_MS;
      timer = setTimeout(check, delay);
    };

    // 백그라운드에 있는 동안 타이머는 늦어지거나 멈춘다. 돌아온 순간 다시 묻되, 30초 안에 물었으면 건너뛴다.
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (Math.abs(Date.now() - lastCheckedAt) < WATCH_POLL_MS) return;
      void check();
    };

    void check();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}

/** 서버가 답한 종료 상태. 연결이 안 되거나 응답을 읽지 못하면 null. */
async function askServer(): Promise<ServiceEndStatus | null> {
  try {
    const response = await fetch(SERVICE_END_STATUS_PATH, { cache: "no-store" });
    if (!response.ok) return null;
    const body = (await response.json()) as Partial<ServiceEndStatus>;
    if (typeof body.ended !== "boolean") return null;
    return {
      ended: body.ended,
      remainingMs: typeof body.remainingMs === "number" ? body.remainingMs : null,
    };
  } catch {
    return null;
  }
}
