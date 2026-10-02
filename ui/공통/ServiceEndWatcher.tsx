"use client";

import { useEffect } from "react";
import {
  SERVICE_ENDED_PATH,
  SERVICE_END_STATUS_PATH,
  WATCH_LEAD_MS,
  WATCH_POLL_MS,
  goToServiceEnded,
  parseServiceEndAt,
  watchDelayMs,
} from "./serviceEnd";

/**
 * 열려 있는 화면을 종료 시각에 종료 화면으로 옮긴다(facecook-fe#127). 화면은 그리지 않는다.
 *
 * API 응답(`SERVICE_ENDED`)만 기다리면 아무것도 누르지 않은 로그인 화면이나 소켓만 기다리는 미션 화면은
 * 그대로 남는다. 그래서 종료 시각 2분 전부터 30초마다, 그리고 화면이 다시 보일 때 서버에 묻는다.
 *
 * 휴대폰 시계는 언제부터 물을지 정하는 데만 쓰고, 옮길지는 서버(proxy) 시계로 정한다 — 시계가 빠른 휴대폰이
 * 운영 중에 종료 화면으로 넘어가지 않게 하기 위해서다.
 */
export function ServiceEndWatcher() {
  useEffect(() => {
    // next.config.ts가 서버 변수 SERVICE_END_AT을 빌드할 때 넣어 준다.
    const endAtMs = parseServiceEndAt(process.env.NEXT_PUBLIC_SERVICE_END_AT);
    if (endAtMs === null) return;

    let stopped = false;
    let checking = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      if (checking || window.location.pathname === SERVICE_ENDED_PATH) return;
      checking = true;
      try {
        if (await askServerEnded()) goToServiceEnded();
      } finally {
        checking = false;
      }
    };

    const tick = async () => {
      if (stopped) return;
      if (Date.now() < endAtMs - WATCH_LEAD_MS) {
        timer = setTimeout(tick, watchDelayMs(endAtMs, Date.now()));
        return;
      }
      await check();
      if (!stopped) timer = setTimeout(tick, WATCH_POLL_MS);
    };

    // 백그라운드에 있는 동안 타이머는 늦어지거나 멈춘다. 돌아온 순간 한 번 더 묻는다.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && Date.now() >= endAtMs - WATCH_LEAD_MS) void check();
    };

    timer = setTimeout(tick, watchDelayMs(endAtMs, Date.now()));
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}

/** 서버가 종료됐다고 답하면 true. 연결이 안 되면 false — 다음 확인이나 API 응답에서 다시 판단한다. */
async function askServerEnded(): Promise<boolean> {
  try {
    const response = await fetch(SERVICE_END_STATUS_PATH, { cache: "no-store" });
    if (!response.ok) return false;
    const body = (await response.json()) as { ended?: unknown };
    return body.ended === true;
  } catch {
    return false;
  }
}
