"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UIEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { useSession } from "@ui/공통/session";
import { logout } from "@ui/로그인/authApi";
import {
  SuperApiError,
  getSuperChatMessages,
  getSuperChats,
  superErrorMessage,
  type SuperChatMessageResponse,
  type SuperChatRoomResponse,
} from "./superApi";

const PAGE_SIZE = 50;

/** 총학생회가 채팅방을 읽기 전용으로 본다. */
export function SuperChatScreen({ matchId }: { matchId: string }) {
  const router = useRouter();
  const { session, signOut } = useSession();
  const numericMatchId = Number(matchId);
  const [room, setRoom] = useState<SuperChatRoomResponse | null>(null);
  const [messages, setMessages] = useState<SuperChatMessageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState<string | null>(null);
  const messageListRef = useRef<HTMLElement>(null);
  const preserveScrollHeightRef = useRef<number | null>(null);
  const shouldScrollBottomRef = useRef(false);
  const loadRequestIdRef = useRef(0);
  const olderRequestIdRef = useRef(0);

  const endSuperSession = useCallback(async () => {
    await logout().catch(() => undefined);
    signOut();
    router.replace("/super");
  }, [router, signOut]);

  const load = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;
    if (!Number.isInteger(numericMatchId) || numericMatchId <= 0) {
      setError("올바르지 않은 채팅방 주소입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setOlderError(null);
    setRoom(null);
    setMessages([]);
    setHasOlder(false);

    try {
      const [rooms, chatMessages] = await Promise.all([
        getSuperChats(),
        getSuperChatMessages(numericMatchId, { limit: PAGE_SIZE }),
      ]);
      if (requestId !== loadRequestIdRef.current) return;

      setRoom(rooms.find((item) => item.matchId === numericMatchId) ?? null);
      shouldScrollBottomRef.current = true;
      setMessages([...chatMessages].reverse());
      setHasOlder(chatMessages.length === PAGE_SIZE);
    } catch (loadError) {
      if (requestId !== loadRequestIdRef.current) return;
      if (isSuperSessionError(loadError)) {
        await endSuperSession();
        return;
      }
      setError(superErrorMessage(loadError));
    } finally {
      if (requestId === loadRequestIdRef.current) setIsLoading(false);
    }
  }, [endSuperSession, numericMatchId]);

  useEffect(() => {
    if (session.role !== "super") {
      router.replace("/super");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    return () => {
      loadRequestIdRef.current += 1;
      olderRequestIdRef.current += 1;
    };
  }, [load, router, session.role]);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;

    const frame = window.requestAnimationFrame(() => {
      const previousHeight = preserveScrollHeightRef.current;
      if (previousHeight !== null) {
        list.scrollTop += list.scrollHeight - previousHeight;
        preserveScrollHeightRef.current = null;
      } else if (shouldScrollBottomRef.current) {
        list.scrollTop = list.scrollHeight;
        shouldScrollBottomRef.current = false;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages]);

  const loadOlderMessages = useCallback(async () => {
    if (!hasOlder || isLoadingOlder || messages.length === 0) return;

    const oldestMessageId = messages[0].messageId;
    const requestId = ++olderRequestIdRef.current;
    preserveScrollHeightRef.current =
      messageListRef.current?.scrollHeight ?? null;
    setIsLoadingOlder(true);
    setOlderError(null);

    try {
      const history = await getSuperChatMessages(numericMatchId, {
        before: oldestMessageId,
        limit: PAGE_SIZE,
      });
      if (requestId !== olderRequestIdRef.current) return;

      if (history.length === 0) {
        preserveScrollHeightRef.current = null;
      } else {
        const chronologicalHistory = [...history].reverse();
        setMessages((current) =>
          prependUniqueMessages(current, chronologicalHistory),
        );
      }
      setHasOlder(history.length === PAGE_SIZE);
    } catch (loadError) {
      if (requestId !== olderRequestIdRef.current) return;
      preserveScrollHeightRef.current = null;
      if (isSuperSessionError(loadError)) {
        await endSuperSession();
        return;
      }
      setOlderError(superErrorMessage(loadError));
    } finally {
      if (requestId === olderRequestIdRef.current) setIsLoadingOlder(false);
    }
  }, [endSuperSession, hasOlder, isLoadingOlder, messages, numericMatchId]);

  const handleScroll = (event: UIEvent<HTMLElement>) => {
    if (event.currentTarget.scrollTop <= 80) void loadOlderMessages();
  };

  if (session.role !== "super") return null;

  const title = room
    ? `${displayName(room.userA)} · ${displayName(room.userB)}`
    : `채팅방 #${matchId}`;

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-(--color-border) bg-(--color-surface) px-3">
        <button
          type="button"
          aria-label="뒤로"
          className="p-1"
          onClick={() => router.push("/super")}
        >
          <ChevronLeft className="h-5 w-5 text-(--color-text-strong)" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-(--color-text-strong)">
            {title}
          </p>
          <p className="break-all text-[11px] text-(--color-text-sub)">
            {room
              ? `${room.userA.email ?? "-"} / ${room.userB.email ?? "-"}`
              : "읽기 전용"}
          </p>
        </div>
      </header>

      <main
        ref={messageListRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col gap-3 overflow-y-auto bg-(--color-chat-bg) p-4"
      >
        <InfoBox tone="info">열람만 가능합니다. 메시지를 보내지는 않아요.</InfoBox>

        {isLoading || error ? (
          <div
            role={error ? "alert" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm ${
              error ? "text-(--color-danger)" : "text-(--color-text-sub)"
            }`}
          >
            <span>{error ?? "채팅을 불러오는 중..."}</span>
            {error ? (
              <Button size="sm" variant="outline" onClick={() => void load()}>
                다시 시도
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            {hasOlder || isLoadingOlder || olderError ? (
              <button
                type="button"
                disabled={isLoadingOlder}
                onClick={() => void loadOlderMessages()}
                className="self-center rounded-(--radius-full) px-3 py-1.5 text-xs font-semibold text-(--color-primary) disabled:text-(--color-text-muted)"
              >
                {isLoadingOlder
                  ? "이전 대화를 불러오는 중..."
                  : olderError
                    ? "이전 대화를 불러오지 못했어요. 다시 시도"
                    : "이전 대화 불러오기"}
              </button>
            ) : null}

            {messages.length === 0 ? (
              <p className="py-12 text-center text-sm text-(--color-text-sub)">
                주고받은 메시지가 없어요.
              </p>
            ) : (
              messages.map((message) => {
                const fromA = room
                  ? message.senderId === room.userA.userId
                  : false;
                const senderName = room
                  ? displayName(fromA ? room.userA : room.userB)
                  : `참가자 #${message.senderId}`;

                return (
                  <div key={message.messageId} className="flex flex-col gap-1">
                    <span className="text-xs text-(--color-text-sub)">
                      {senderName} · {formatTime(message.sentAt)}
                    </span>
                    <p
                      className={`max-w-[80%] whitespace-pre-wrap break-words rounded-(--radius-lg) px-3.5 py-2.5 text-sm leading-relaxed ${
                        fromA
                          ? "bg-(--color-chat-other) text-(--color-chat-other-text)"
                          : "self-end bg-(--color-primary-light) text-(--color-text-strong)"
                      }`}
                    >
                      {message.content}
                    </p>
                  </div>
                );
              })
            )}
          </>
        )}
      </main>
    </PhoneFrame>
  );
}

function prependUniqueMessages(
  current: SuperChatMessageResponse[],
  older: SuperChatMessageResponse[],
) {
  const currentIds = new Set(current.map((message) => message.messageId));
  return [
    ...older.filter((message) => !currentIds.has(message.messageId)),
    ...current,
  ];
}

function isSuperSessionError(error: unknown) {
  return (
    error instanceof SuperApiError &&
    (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN")
  );
}

function displayName(member: SuperChatRoomResponse["userA"]) {
  return member.nickname ?? member.email ?? `참가자 #${member.userId}`;
}

function formatTime(value: string) {
  return value.split("T")[1]?.slice(0, 5) ?? value;
}
