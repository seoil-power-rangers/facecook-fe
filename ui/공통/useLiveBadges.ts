"use client";

import { useSyncExternalStore } from "react";
import {
  getLiveBadgesSnapshot,
  subscribeLiveBadges,
  type LiveBadgesState,
} from "@ui/공통/liveBadgesStore";

/** 콕/매칭을 5초마다 조회하는 걸 화면 여러 곳(TabBar, 홈)에서 공유한다. */
export function useLiveBadges(): LiveBadgesState {
  return useSyncExternalStore(subscribeLiveBadges, getLiveBadgesSnapshot, getLiveBadgesSnapshot);
}
