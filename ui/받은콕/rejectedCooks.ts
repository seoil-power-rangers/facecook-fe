"use client";

import { useEffect, useState } from "react";

/**
 * 거절한 콕을 목록에서 감춘다.
 *
 * 서버에 거절 API가 없다(API명세 3절에 콕은 보내기·조회뿐이고, DELETE는 보낸
 * 사람이 자기 콕을 취소하는 용도라 받은 콕에는 쓸 수 없다). 그래서 감추는
 * 일만 브라우저에 남긴다 — readState.ts가 읽음 상태를 다루는 방식과 같다.
 *
 * 거절은 상대에게 알리지 않는다. 보낸 사람 입장에서는 아직 답이 없는 것과
 * 구분되지 않는데, 부스에서 얼굴을 마주칠 수 있는 사이라 "거절당했다"를
 * 통보하는 쪽이 더 나쁘다. 그래서 서버가 몰라도 화면 동작은 같다.
 *
 * 한계는 분명하다 — 기기마다 따로 센다. 3일짜리 행사에서 각자 자기 폰만
 * 쓰므로 그대로 간다. 서버에 거절이 생기면 이 파일을 그 API로 바꾸면 된다.
 */
const STORAGE_KEY = "facecook:kok:rejected";

/**
 * 화면 여러 곳이 같은 목록을 봐야 한다. 콕 화면에서 거절했는데 탭 배지나
 * 홈의 "받은 콕"에 그대로 남아 있으면, 목록은 비었는데 숫자만 도는 꼴이 된다.
 *
 * localStorage는 서버 렌더에 없으므로 처음에는 빈 집합으로 시작하고 화면이
 * 붙은 뒤에 읽는다.
 */
export function useRejectedCooks() {
  const [ids, setIds] = useState<Set<number>>(EMPTY);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIds(readRejected());

    // 다른 탭에서 거절해도 따라가게 한다.
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setIds(readRejected());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return ids;
}

const EMPTY: Set<number> = new Set();

export function readRejected(): Set<number> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return new Set();
    const ids = JSON.parse(saved) as unknown;
    return new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === "number") : []);
  } catch {
    // 시크릿 모드 등에서 막히면 아무것도 거절하지 않은 것으로 본다.
    return new Set();
  }
}

function save(ids: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // 저장 실패는 무시 — 이번 화면에서는 감춰지고 다시 열면 돌아온다.
  }
}

export function rejectCook(current: Set<number>, cookId: number) {
  const next = new Set(current).add(cookId);
  save(next);
  return next;
}

export function undoReject(current: Set<number>, cookId: number) {
  const next = new Set(current);
  next.delete(cookId);
  save(next);
  return next;
}
