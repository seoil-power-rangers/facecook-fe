"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, UIEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clock, Lock, Send, Ticket } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { markRoomRead } from "@ui/매칭/readState";
import { Toast } from "@ui/공통/Toast";
import {
  ChatApiError,
  chatErrorMessage,
  getChatMessages,
  type ChatMessageResponse,
} from "./chatApi";
import {
  connectChatSocket,
  type ChatConnectionStatus,
  type ChatSocketConnection,
} from "./chatSocket";
import {
  getMatch,
  matchErrorMessage,
  type MatchResponse,
} from "@ui/매칭/matchApi";

const CHAT_OPEN_HOUR = Number(process.env.NEXT_PUBLIC_CHAT_OPEN_HOUR ?? "9");
const CHAT_CLOSE_HOUR = Number(process.env.NEXT_PUBLIC_CHAT_CLOSE_HOUR ?? "18");
const PAGE_SIZE = 50;
const ACK_TIMEOUT_MS = 10_000;
type DeliveryState = "pending" | "sent" | "failed";

interface DisplayMessage {
  messageId: number | null;
  matchId: number;
  senderId: number;
  content: string;
  clientMessageId: string;
  sentAt: string;
  delivery: DeliveryState;
}

export function ChatScreen({ matchId }: { matchId: string }) {
  const router = useRouter();
  const numericMatchId = Number(matchId);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ChatConnectionStatus>("connecting");
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(isWithinOperatingHours);
  const messageListRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ChatSocketConnection | null>(null);
  const pendingTimeoutsRef = useRef(new Map<string, number>());
  const preserveScrollHeightRef = useRef<number | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const loadConversation = useCallback(async () => {
    if (!Number.isInteger(numericMatchId) || numericMatchId <= 0) {
      setHistoryError("올바르지 않은 채팅방 주소예요.");
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const [matchResponse, history] = await Promise.all([
        getMatch(numericMatchId),
        getChatMessages(numericMatchId, { limit: PAGE_SIZE }),
      ]);
      setMatch(matchResponse);
      setMessages(sortMessages(history.map(serverMessage)));
      setHasOlder(history.length === PAGE_SIZE);
      shouldAutoScrollRef.current = true;
    } catch (loadError) {
      setHistoryError(
        loadError instanceof ChatApiError
          ? chatErrorMessage(loadError)
          : matchErrorMessage(loadError),
      );
    } finally {
      setIsHistoryLoading(false);
    }
  }, [numericMatchId]);

  useEffect(() => {
    if (Number.isNaN(numericMatchId)) return;

    // 들어올 때와 나갈 때 모두 읽음으로 친다. 입장 시점에만 찍으면, 방에
    // 머무는 동안 온 메시지가 목록에서 안 읽음으로 남는다.
    markRoomRead(numericMatchId);
    return () => markRoomRead(numericMatchId);
  }, [numericMatchId]);

  useEffect(() => {
    // 라우트의 matchId가 바뀌면 매칭 정보와 첫 메시지 페이지를 다시 불러온다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIsOpen(isWithinOperatingHours());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const mergeIncomingMessage = useCallback((incoming: ChatMessageResponse) => {
    const pendingTimeout = pendingTimeoutsRef.current.get(incoming.clientMessageId);
    if (pendingTimeout !== undefined) {
      window.clearTimeout(pendingTimeout);
      pendingTimeoutsRef.current.delete(incoming.clientMessageId);
    }
    const list = messageListRef.current;
    shouldAutoScrollRef.current =
      !list || list.scrollHeight - list.scrollTop - list.clientHeight < 80;
    setMessages((current) => mergeServerMessage(current, incoming));
  }, []);

  useEffect(() => {
    const pendingTimeouts = pendingTimeoutsRef.current;
    return () => {
      for (const timeout of pendingTimeouts.values()) window.clearTimeout(timeout);
      pendingTimeouts.clear();
    };
  }, []);

  useEffect(() => {
    if (!match) return;

    let active = true;
    let connection: ChatSocketConnection | null = null;

    try {
      connection = connectChatSocket({
        matchId: match.matchId,
        onMessage: (message) => {
          if (active) mergeIncomingMessage(message);
        },
        onAck: (message) => {
          if (active) mergeIncomingMessage(message);
        },
        onError: (socketError) => {
          if (!active) return;
          for (const timeout of pendingTimeoutsRef.current.values()) {
            window.clearTimeout(timeout);
          }
          pendingTimeoutsRef.current.clear();
          setToastMessage(socketError.message);
          setMessages((current) => markPendingMessagesFailed(current));
        },
        onStatusChange: (status) => {
          if (active) setConnectionStatus(status);
        },
      });
      socketRef.current = connection;
    } catch (socketError) {
      // 소켓 설정 자체가 잘못된 경우 연결 시도 직후 오류 상태를 표시한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConnectionStatus("error");
      setToastMessage(
        socketError instanceof Error
          ? socketError.message
          : "실시간 채팅 서버에 연결하지 못했어요.",
      );
    }

    return () => {
      active = false;
      socketRef.current = null;
      if (connection) void connection.disconnect();
    };
  }, [connectionAttempt, match, mergeIncomingMessage]);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;

    const frame = window.requestAnimationFrame(() => {
      const previousHeight = preserveScrollHeightRef.current;
      if (previousHeight !== null) {
        list.scrollTop += list.scrollHeight - previousHeight;
        preserveScrollHeightRef.current = null;
      } else if (shouldAutoScrollRef.current) {
        list.scrollTop = list.scrollHeight;
        shouldAutoScrollRef.current = false;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages]);

  const loadOlderMessages = useCallback(async () => {
    if (!match || !hasOlder || isLoadingOlder) return;
    const oldestId = oldestMessageId(messages);
    if (oldestId === null) {
      setHasOlder(false);
      return;
    }

    const list = messageListRef.current;
    preserveScrollHeightRef.current = list?.scrollHeight ?? null;
    setIsLoadingOlder(true);
    try {
      const history = await getChatMessages(match.matchId, {
        before: oldestId,
        limit: PAGE_SIZE,
      });
      if (history.length === 0) {
        preserveScrollHeightRef.current = null;
      } else {
        setMessages((current) => mergeHistory(current, history));
      }
      setHasOlder(history.length === PAGE_SIZE);
    } catch (loadError) {
      preserveScrollHeightRef.current = null;
      setToastMessage(chatErrorMessage(loadError));
    } finally {
      setIsLoadingOlder(false);
    }
  }, [hasOlder, isLoadingOlder, match, messages]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (event.currentTarget.scrollTop <= 80) void loadOlderMessages();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || !match || !isOpen) return;
    if (connectionStatus !== "connected" || !socketRef.current) {
      setToastMessage("실시간 채팅 연결을 확인해주세요.");
      return;
    }

    const clientMessageId = crypto.randomUUID();
    const pendingMessage: DisplayMessage = {
      messageId: null,
      matchId: match.matchId,
      senderId: -1,
      content,
      clientMessageId,
      sentAt: new Date().toISOString(),
      delivery: "pending",
    };

    shouldAutoScrollRef.current = true;
    setMessages((current) => sortMessages([...current, pendingMessage]));
    setInput("");

    try {
      socketRef.current.send(content, clientMessageId);
      const timeout = window.setTimeout(() => {
        pendingTimeoutsRef.current.delete(clientMessageId);
        setMessages((current) => markMessageFailed(current, clientMessageId));
        setToastMessage("메시지 저장을 확인하지 못했어요. 다시 시도해주세요.");
      }, ACK_TIMEOUT_MS);
      pendingTimeoutsRef.current.set(clientMessageId, timeout);
    } catch (sendError) {
      setMessages((current) => markMessageFailed(current, clientMessageId));
      setToastMessage(
        sendError instanceof Error ? sendError.message : "메시지를 보내지 못했어요.",
      );
    }
  };

  if (isHistoryLoading || historyError || !match) {
    return (
      <PhoneFrame>
        <header className="flex h-14 shrink-0 items-center border-b border-(--color-border) bg-(--color-surface) px-3">
          <button type="button" aria-label="뒤로가기" className="p-1" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </button>
        </header>
        <div
          role={historyError ? "alert" : undefined}
          className={`flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm ${
            historyError ? "text-(--color-danger)" : "text-(--color-text-sub)"
          }`}
        >
          <span>{historyError ?? "채팅을 불러오는 중..."}</span>
          {historyError ? (
            <Button size="sm" variant="outline" onClick={() => void loadConversation()}>
              다시 시도
            </Button>
          ) : null}
        </div>
      </PhoneFrame>
    );
  }

  const partner = match.partner;
  const profileSubInfo = [partner.mbti, partner.department].filter(Boolean).join(" · ");

  return (
    <PhoneFrame>
      <Toast
        open={toastMessage !== null}
        message={toastMessage ?? ""}
        onDismiss={() => setToastMessage(null)}
      />

      <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-(--color-border) bg-(--color-surface) px-3">
        <button type="button" aria-label="뒤로가기" className="p-1" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5 text-(--color-text-strong)" />
        </button>
        <Link href={`/profile/${partner.userId}`} className="flex flex-1 items-center gap-3 overflow-hidden">
          <Avatar
            name={partner.nickname}
            size="md"
            userId={partner.userId}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-(--color-text-strong)">{partner.nickname}</span>
              <ConnectionBadge status={connectionStatus} />
            </div>
            <span className="truncate text-xs text-(--color-text-sub)">{profileSubInfo}</span>
          </div>
        </Link>
        <Link
          href={`/match/${match.matchId}/mission`}
          className="flex shrink-0 items-center gap-1 rounded-full border border-(--color-border) px-3 py-1.5 text-xs font-semibold text-(--color-text-strong)"
        >
          <Ticket className="h-3.5 w-3.5" />
          미션 보기
        </Link>
      </header>

      {connectionStatus === "error" || connectionStatus === "disconnected" ? (
        <div role="alert" className="flex shrink-0 items-center justify-between gap-3 bg-(--color-danger-light) px-4 py-2 text-xs text-(--color-danger)">
          <span>실시간 연결이 끊겼어요.</span>
          <button
            type="button"
            className="shrink-0 font-semibold underline"
            onClick={() => setConnectionAttempt((attempt) => attempt + 1)}
          >
            다시 연결
          </button>
        </div>
      ) : null}

      <main
        ref={messageListRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col gap-3 overflow-y-auto bg-(--color-chat-bg) p-4"
      >
        {isLoadingOlder ? (
          <p className="text-center text-xs text-(--color-text-muted)">이전 메시지를 불러오는 중...</p>
        ) : null}
        {!hasOlder && messages.length > 0 ? (
          <p className="text-center text-xs text-(--color-text-muted)">대화의 시작이에요</p>
        ) : null}
        <p className="text-center text-xs text-(--color-text-muted)">
          {formatMatchedAt(match.matchedAt)} · 매칭됨
        </p>
        {messages.length === 0 ? (
          <p className="my-auto text-center text-sm text-(--color-text-sub)">
            먼저 반갑게 인사해보세요.
          </p>
        ) : null}
        {messages.map((message) => (
          <MessageBubble
            key={message.clientMessageId}
            message={message}
            isMine={message.senderId !== partner.userId}
          />
        ))}
      </main>

      {isOpen ? (
        <ChatComposer
          value={input}
          connected={connectionStatus === "connected"}
          onChange={setInput}
          onSubmit={handleSubmit}
        />
      ) : (
        <ClosedComposer />
      )}
    </PhoneFrame>
  );
}

function ConnectionBadge({ status }: { status: ChatConnectionStatus }) {
  const connected = status === "connected";
  return (
    <span className={`flex shrink-0 items-center gap-1 text-xs ${connected ? "text-(--color-online)" : "text-(--color-text-muted)"}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-(--color-online)" : "bg-(--color-text-muted)"}`}
        aria-hidden="true"
      />
      {connected ? "실시간 연결됨" : status === "connecting" ? "연결 중" : "연결 끊김"}
    </span>
  );
}

function MessageBubble({ message, isMine }: { message: DisplayMessage; isMine: boolean }) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[75%] flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
        <div
          className={
            isMine
              ? "rounded-(--radius-lg) bg-(--color-chat-mine) px-3 py-2 text-sm text-(--color-chat-mine-text)"
              : "rounded-(--radius-lg) bg-(--color-chat-other) px-3 py-2 text-sm text-(--color-chat-other-text) shadow-(--shadow-card)"
          }
        >
          {message.content}
        </div>
        <span className={`text-[11px] ${message.delivery === "failed" ? "text-(--color-danger)" : "text-(--color-text-muted)"}`}>
          {message.delivery === "pending"
            ? "전송 중..."
            : message.delivery === "failed"
              ? "전송 실패"
              : formatMessageTime(message.sentAt)}
        </span>
      </div>
    </div>
  );
}

function ChatComposer({
  value,
  connected,
  onChange,
  onSubmit,
}: {
  value: string;
  connected: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex shrink-0 items-center gap-2 border-t border-(--color-border) bg-(--color-surface) p-3"
    >
      {/* 16px 미만으로 줄이지 말 것 — iOS가 포커스 시 화면을 확대한다. */}
      <input
        type="text"
        value={value}
        maxLength={1000}
        disabled={!connected}
        onChange={(event) => onChange(event.target.value)}
        placeholder={connected ? "메시지 보내기" : "채팅 서버에 연결 중..."}
        className="h-11 flex-1 rounded-full border border-(--color-border) bg-(--color-surface-alt) px-4 text-base text-(--color-text-strong) outline-none placeholder:text-(--color-text-muted) disabled:text-(--color-disabled-text)"
      />
      <button
        type="submit"
        disabled={!connected || value.trim().length === 0}
        aria-label="메시지 전송"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-primary) text-(--color-text-on-primary) disabled:bg-(--color-disabled-bg) disabled:text-(--color-disabled-text)"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}

function ClosedComposer() {
  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-(--color-border) bg-(--color-surface) p-4">
      <div className="flex items-center gap-3 rounded-(--radius-lg) bg-(--color-surface-alt) p-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-disabled-bg) text-(--color-text-muted)">
          <Lock className="h-4 w-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-bold text-(--color-text-strong)">지금은 채팅 운영시간이 아니에요</p>
          <p className="flex items-center gap-1 text-xs text-(--color-text-sub)">
            <Clock className="h-3 w-3" />
            매일 {String(CHAT_OPEN_HOUR).padStart(2, "0")}:00 ~{" "}
            {String(CHAT_CLOSE_HOUR).padStart(2, "0")}:00 · 서울시간
          </p>
        </div>
      </div>
    </div>
  );
}

function serverMessage(message: ChatMessageResponse): DisplayMessage {
  return { ...message, delivery: "sent" };
}

function mergeServerMessage(current: DisplayMessage[], incoming: ChatMessageResponse) {
  const index = current.findIndex(
    (message) =>
      message.clientMessageId === incoming.clientMessageId ||
      (message.messageId !== null && message.messageId === incoming.messageId),
  );
  const next = [...current];
  if (index >= 0) next[index] = serverMessage(incoming);
  else next.push(serverMessage(incoming));
  return sortMessages(next);
}

function mergeHistory(current: DisplayMessage[], history: ChatMessageResponse[]) {
  return history.reduce(mergeServerMessage, current);
}

function sortMessages(messages: DisplayMessage[]) {
  return [...messages].sort((left, right) => {
    const timeDifference = new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime();
    if (timeDifference !== 0) return timeDifference;
    return (left.messageId ?? Number.MAX_SAFE_INTEGER) - (right.messageId ?? Number.MAX_SAFE_INTEGER);
  });
}

function oldestMessageId(messages: DisplayMessage[]) {
  const ids = messages.flatMap((message) => (message.messageId === null ? [] : [message.messageId]));
  return ids.length === 0 ? null : Math.min(...ids);
}

function markMessageFailed(messages: DisplayMessage[], clientMessageId: string) {
  return messages.map((message) =>
    message.clientMessageId === clientMessageId
      ? { ...message, delivery: "failed" as const }
      : message,
  );
}

function markPendingMessagesFailed(messages: DisplayMessage[]) {
  return messages.map((message) =>
    message.delivery === "pending"
      ? { ...message, delivery: "failed" as const }
      : message,
  );
}

function isWithinOperatingHours() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
  return hour >= CHAT_OPEN_HOUR && hour < CHAT_CLOSE_HOUR;
}

function formatMatchedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "매칭";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
