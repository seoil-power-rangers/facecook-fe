"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { useSession } from "@ui/공통/session";
import {
  getSuperChatMessages,
  getSuperChats,
  superErrorMessage,
  type SuperChatMessageResponse,
  type SuperChatRoomResponse,
} from "./superApi";

/** 총학생회가 채팅방을 읽기 전용으로 본다. */
export function SuperChatScreen({ matchId }: { matchId: string }) {
  const router = useRouter();
  const { session } = useSession();
  const numericMatchId = Number(matchId);
  const [room, setRoom] = useState<SuperChatRoomResponse | null>(null);
  const [messages, setMessages] = useState<SuperChatMessageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isInteger(numericMatchId) || numericMatchId <= 0) {
      setError("올바르지 않은 채팅방 주소입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [rooms, chatMessages] = await Promise.all([
        getSuperChats(),
        getSuperChatMessages(numericMatchId),
      ]);
      setRoom(rooms.find((item) => item.matchId === numericMatchId) ?? null);
      setMessages([...chatMessages].reverse());
    } catch (loadError) {
      setError(superErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [numericMatchId]);

  useEffect(() => {
    if (session.role !== "super") {
      router.replace("/super");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, router, session.role]);

  if (session.role !== "super") {
    return null;
  }

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

      <main className="flex flex-1 flex-col gap-3 overflow-y-auto bg-(--color-chat-bg) p-4">
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
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-(--color-text-sub)">
            주고받은 메시지가 없어요.
          </p>
        ) : (
          messages.map((message) => {
            const fromA = room ? message.senderId === room.userA.userId : false;
            const senderName = room
              ? displayName(fromA ? room.userA : room.userB)
              : `참가자 #${message.senderId}`;

            return (
              <div key={message.messageId} className="flex flex-col gap-1">
                <span className="text-xs text-(--color-text-sub)">
                  {senderName} · {formatTime(message.sentAt)}
                </span>
                <p
                  className={`max-w-[80%] rounded-(--radius-lg) px-3.5 py-2.5 text-sm leading-relaxed ${
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
      </main>
    </PhoneFrame>
  );
}

function displayName(member: SuperChatRoomResponse["userA"]) {
  return member.nickname ?? member.email ?? `참가자 #${member.userId}`;
}

function formatTime(value: string) {
  return value.split("T")[1]?.slice(0, 5) ?? value;
}
