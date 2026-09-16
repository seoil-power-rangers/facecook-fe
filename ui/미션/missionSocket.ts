import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import {
  parseMissionProgress,
  type MissionProgressResponse,
} from "./missionModel";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export interface MissionSocketConnection {
  disconnect: () => Promise<void>;
}

export function connectMissionSocket({
  matchId,
  onMission,
  onError,
}: {
  matchId: number;
  onMission: (progress: MissionProgressResponse) => void;
  onError?: (error: Error) => void;
}): MissionSocketConnection {
  let intentionalDisconnect = false;
  let subscription: StompSubscription | undefined;
  const client = new Client({
    brokerURL: requireWebSocketUrl(),
    reconnectDelay: 3_000,
    connectionTimeout: 10_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    onConnect: () => {
      subscription = client.subscribe(`/topic/mission/${matchId}`, (frame) => {
        parseFrame(frame, onMission, onError);
      });
    },
    onStompError: (frame) => {
      onError?.(new Error(frame.headers.message ?? "실시간 미션을 갱신하지 못했어요."));
    },
    onWebSocketError: () => {
      if (!intentionalDisconnect) {
        onError?.(new Error("실시간 미션 서버에 연결하지 못했어요."));
      }
    },
  });

  client.activate();
  return {
    async disconnect() {
      intentionalDisconnect = true;
      if (client.connected) subscription?.unsubscribe();
      await client.deactivate();
    },
  };
}

export function parseMissionFrame(
  frame: IMessage,
  onMission: (progress: MissionProgressResponse) => void,
  onError?: (error: Error) => void,
) {
  parseFrame(frame, onMission, onError);
}

function parseFrame(
  frame: IMessage,
  onMission: (progress: MissionProgressResponse) => void,
  onError?: (error: Error) => void,
) {
  try {
    onMission(parseMissionProgress(JSON.parse(frame.body) as unknown));
  } catch {
    onError?.(new Error("실시간 미션 정보를 읽지 못했어요."));
  }
}

function requireWebSocketUrl() {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.");
  }
  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `${url.pathname.replace(/\/$/, "")}/ws`;
  url.search = "";
  url.hash = "";
  return url.toString();
}
