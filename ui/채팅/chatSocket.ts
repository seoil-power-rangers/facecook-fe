import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import type { ChatMessageResponse } from "./chatApi";
import { parseMissionFrame } from "@ui/미션/missionSocket";
import type { MissionProgressResponse } from "@ui/미션/missionModel";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export type ChatConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface ChatSocketError {
  code: string;
  message: string;
}

interface ConnectChatSocketOptions {
  matchId: number;
  onMessage: (message: ChatMessageResponse) => void;
  onAck: (message: ChatMessageResponse) => void;
  onMission: (progress: MissionProgressResponse) => void;
  onMissionError?: (error: Error) => void;
  onError: (error: ChatSocketError) => void;
  onStatusChange: (status: ChatConnectionStatus) => void;
}

export interface ChatSocketConnection {
  send: (content: string, clientMessageId: string) => void;
  disconnect: () => Promise<void>;
}

const SOCKET_ERROR_MESSAGES: Record<string, string> = {
  CLOSED: "채팅 운영시간이 끝났어요. 내일 09:00에 다시 이용해주세요.",
  UNAUTHORIZED: "로그인이 만료됐어요. 다시 로그인해주세요.",
  FORBIDDEN: "이 채팅방에 접근할 수 없어요.",
  NOT_FOUND: "채팅방을 찾을 수 없어요.",
  SUSPENDED: "정지된 계정은 채팅을 이용할 수 없어요.",
  VALIDATION: "메시지 내용을 확인해주세요.",
};

export function connectChatSocket({
  matchId,
  onMessage,
  onAck,
  onMission,
  onMissionError,
  onError,
  onStatusChange,
}: ConnectChatSocketOptions): ChatSocketConnection {
  let intentionalDisconnect = false;
  let topicSubscription: StompSubscription | undefined;
  let ackSubscription: StompSubscription | undefined;
  let missionSubscription: StompSubscription | undefined;
  let connectFallbackTimeout: number | undefined;

  const client = new Client({
    brokerURL: requireWebSocketUrl(),
    reconnectDelay: 0,
    connectionTimeout: 10_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    onConnect: () => {
      /*
       * "connected"를 구독 전에 알리면, 화면(ChatScreen)이 그 신호로 시작하는
       * 이력 대조가 브로커에 SUBSCRIBE가 아직 반영되기 전에 끝날 수 있다 —
       * 그 틈에 저장·발행된 메시지는 실시간 구독에도, 그 대조에도 안 걸려
       * facecook-fe#87이 없애려던 공백이 그대로 남는다. 그래서 채팅 topic·ACK
       * 구독 둘 다 브로커의 RECEIPT로 반영을 확인한 뒤에야 "connected"를 알린다.
       * (미션 구독은 이 복구 보장과 무관해 기다리지 않는다.)
       *
       * RECEIPT가 못 오는 드문 경우(프록시 등)까지 대비해, 일정 시간 뒤에는
       * 확인 없이도 강제로 연결됨을 알린다 — 그러면 화면이 "연결 중"에 영영
       * 머무르지 않는다. 이 경로에서는 초기 공백 보장이 성립하지 않지만, 20초
       * 주기 대조가 뒤이어 채운다.
       */
      const topicReceiptId = `chat-topic-${crypto.randomUUID()}`;
      const ackReceiptId = `chat-ack-${crypto.randomUUID()}`;
      let topicReady = false;
      let ackReady = false;
      let signaled = false;

      const signalConnected = () => {
        if (signaled || intentionalDisconnect) return;
        signaled = true;
        if (connectFallbackTimeout !== undefined) {
          window.clearTimeout(connectFallbackTimeout);
          connectFallbackTimeout = undefined;
        }
        onStatusChange("connected");
      };

      connectFallbackTimeout = window.setTimeout(signalConnected, 5_000);

      client.watchForReceipt(topicReceiptId, () => {
        topicReady = true;
        if (topicReady && ackReady) signalConnected();
      });
      client.watchForReceipt(ackReceiptId, () => {
        ackReady = true;
        if (topicReady && ackReady) signalConnected();
      });

      topicSubscription = client.subscribe(
        `/topic/chat/${matchId}`,
        (frame) => {
          parseMessage(frame, onMessage, onError);
        },
        { receipt: topicReceiptId },
      );
      ackSubscription = client.subscribe(
        "/user/queue/chat-acks",
        (frame) => {
          parseMessage(frame, onAck, onError);
        },
        { receipt: ackReceiptId },
      );
      missionSubscription = client.subscribe(`/topic/mission/${matchId}`, (frame) => {
        parseMissionFrame(frame, onMission, onMissionError);
      });
    },
    onStompError: (frame) => {
      onStatusChange("error");
      onError(parseError(frame.body, frame.headers.message));
    },
    onWebSocketError: () => {
      if (intentionalDisconnect) return;
      onStatusChange("error");
      onError({
        code: "CONNECTION_FAILED",
        message: "실시간 채팅 서버에 연결하지 못했어요.",
      });
    },
    onWebSocketClose: () => {
      if (!intentionalDisconnect) onStatusChange("disconnected");
    },
  });

  onStatusChange("connecting");
  client.activate();

  return {
    send(content, clientMessageId) {
      if (!client.connected) {
        throw new Error("실시간 채팅 서버에 연결되어 있지 않습니다.");
      }
      client.publish({
        destination: `/app/chat/${matchId}/send`,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, clientMessageId }),
      });
    },
    async disconnect() {
      intentionalDisconnect = true;
      if (connectFallbackTimeout !== undefined) {
        window.clearTimeout(connectFallbackTimeout);
        connectFallbackTimeout = undefined;
      }
      if (client.connected) {
        topicSubscription?.unsubscribe();
        ackSubscription?.unsubscribe();
        missionSubscription?.unsubscribe();
      }
      await client.deactivate();
      onStatusChange("disconnected");
    },
  };
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

  // 브라우저 WebSocket API에는 credentials 옵션이나 Cookie 헤더 설정 기능이 없다.
  // 핸드셰이크 대상 URL에 적용 가능한 세션 쿠키는 브라우저가 자동으로 포함한다.
  return url.toString();
}

function parseMessage(
  frame: IMessage,
  handler: (message: ChatMessageResponse) => void,
  onError: (error: ChatSocketError) => void,
) {
  try {
    handler(JSON.parse(frame.body) as ChatMessageResponse);
  } catch {
    onError({ code: "INVALID_MESSAGE", message: "채팅 메시지를 읽지 못했어요." });
  }
}

function parseError(body: string, fallback?: string): ChatSocketError {
  try {
    const payload = JSON.parse(body) as { code?: string; message?: string };
    const code = payload.code ?? "SOCKET_ERROR";
    return {
      code,
      message:
        SOCKET_ERROR_MESSAGES[code] ??
        payload.message ??
        fallback ??
        "실시간 채팅 중 오류가 발생했어요.",
    };
  } catch {
    return {
      code: "SOCKET_ERROR",
      message: fallback ?? "실시간 채팅 중 오류가 발생했어요.",
    };
  }
}
