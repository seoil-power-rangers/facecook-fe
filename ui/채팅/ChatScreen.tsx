"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clock, Lock, Send, Ticket } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";

const CHAT_OPEN_HOUR = 9;
const CHAT_CLOSE_HOUR = 18;

function isWithinOperatingHours(hour: number) {
  return hour >= CHAT_OPEN_HOUR && hour < CHAT_CLOSE_HOUR;
}

export type ChatItem =
  | { kind: "system"; id: string; text: string }
  | { kind: "mission"; id: string; step: number; title: string; description: string }
  | { kind: "message"; id: string; from: "me" | "other"; text: string }
  | { kind: "divider"; id: string; label: string };

export type Presence =
  | { kind: "online" }
  | { kind: "away" }
  | { kind: "lastActive"; minutesAgo: number };

export interface ChatScreenProps {
  userId: string;
  name: string;
  mbti: string;
  department: string;
  bgColor: string;
  presence: Presence;
  messages: ChatItem[];
}

export function ChatScreen({
  userId,
  name,
  mbti,
  department,
  bgColor,
  presence,
  messages,
}: ChatScreenProps) {
  const router = useRouter();

  const currentHour = new Date().getHours();
  const isOpen = isWithinOperatingHours(currentHour);

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-(--color-border) bg-(--color-surface) px-3">
        <button type="button" aria-label="뒤로가기" className="p-1" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5 text-(--color-text-strong)" />
        </button>
        <Link href={`/profile/${userId}`} className="flex flex-1 items-center gap-3 overflow-hidden">
          <Avatar name={name} size="md" bgColor={bgColor} online={presence.kind === "online"} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-(--color-text-strong)">{name}</span>
              <PresenceBadge presence={presence} />
            </div>
            <span className="truncate text-xs text-(--color-text-sub)">
              {mbti} · {department}
            </span>
          </div>
        </Link>
        <Link
          href={`/match/${userId}/mission`}
          className="flex shrink-0 items-center gap-1 rounded-full border border-(--color-border) px-3 py-1.5 text-xs font-semibold text-(--color-text-strong)"
        >
          <Ticket className="h-3.5 w-3.5" />
          미션 보기
        </Link>
      </header>

      <main className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((item) => (
          <ChatItemRow key={item.id} item={item} />
        ))}
      </main>

      {isOpen ? <OpenComposer /> : <ClosedComposer />}
    </PhoneFrame>
  );
}

function PresenceBadge({ presence }: { presence: Presence }) {
  if (presence.kind === "online") {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs text-(--color-online)">
        <span className="h-1.5 w-1.5 rounded-full bg-(--color-online)" aria-hidden="true" />
        활동 중
      </span>
    );
  }

  if (presence.kind === "away") {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs text-(--color-text-muted)">
        <span className="h-1.5 w-1.5 rounded-full bg-(--color-text-muted)" aria-hidden="true" />
        자리비움
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-1 text-xs text-(--color-text-muted)">
      <span className="h-1.5 w-1.5 rounded-full bg-(--color-text-muted)" aria-hidden="true" />
      {presence.minutesAgo}분 전 활동
    </span>
  );
}

function ChatItemRow({ item }: { item: ChatItem }) {
  if (item.kind === "system") {
    return <p className="text-center text-xs text-(--color-text-muted)">{item.text}</p>;
  }

  if (item.kind === "divider") {
    return <p className="text-center text-xs text-(--color-text-muted)">{item.label}</p>;
  }

  if (item.kind === "mission") {
    return (
      <div className="flex flex-col gap-2 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 shadow-(--shadow-card)">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Tag variant="primary">STEP {item.step}</Tag>
            <Tag variant="warning">진행 중</Tag>
          </div>
          <Ticket className="h-4 w-4 text-(--color-text-sub)" aria-hidden="true" />
        </div>
        <p className="text-sm font-bold text-(--color-text-strong)">{item.title}</p>
        <p className="text-xs text-(--color-text-sub)">{item.description}</p>
      </div>
    );
  }

  const isMe = item.from === "me";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isMe
            ? "max-w-[75%] rounded-(--radius-lg) bg-(--color-chat-mine) px-3 py-2 text-sm text-(--color-chat-mine-text)"
            : "max-w-[75%] rounded-(--radius-lg) bg-(--color-chat-other) px-3 py-2 text-sm text-(--color-chat-other-text) shadow-(--shadow-card)"
        }
      >
        {item.text}
      </div>
    </div>
  );
}

function OpenComposer() {
  return (
    <div className="flex shrink-0 items-center gap-2 border-t border-(--color-border) bg-(--color-surface) p-3">
      <input
        type="text"
        placeholder="메시지 보내기"
        className="h-11 flex-1 rounded-full border border-(--color-border) bg-(--color-surface-alt) px-4 text-sm text-(--color-text-strong) outline-none placeholder:text-(--color-text-muted)"
      />
      <button
        type="button"
        aria-label="메시지 전송"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-primary) text-(--color-text-on-primary)"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}

function ClosedComposer() {
  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-(--color-border) bg-(--color-surface) p-4">
      <div className="flex flex-col items-center gap-2 rounded-(--radius-lg) bg-(--color-surface) p-4 text-center shadow-(--shadow-card)">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-(--color-disabled-bg) text-(--color-text-muted)">
          <Lock className="h-5 w-5" />
        </span>
        <p className="text-sm font-bold text-(--color-text-strong)">오늘 채팅은 종료됐어요</p>
        <p className="text-xs text-(--color-text-sub)">내일 09:00부터 이어서 대화할 수 있어요.</p>

        <div className="mt-1 flex w-full items-center gap-2 rounded-(--radius-lg) bg-(--color-primary-lighter) px-3 py-2.5 text-left">
          <Clock className="h-4 w-4 shrink-0 text-(--color-primary)" />
          <div className="flex flex-col">
            <span className="text-xs text-(--color-text-sub)">채팅 운영시간</span>
            <span className="text-sm font-bold text-(--color-text-strong)">
              매일 {String(CHAT_OPEN_HOUR).padStart(2, "0")}:00 ~ {String(CHAT_CLOSE_HOUR).padStart(2, "0")}:00
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center text-(--color-text-muted)">
          <Lock className="h-4 w-4" />
        </span>
        <span className="flex-1 text-xs text-(--color-text-muted)">
          {String(CHAT_OPEN_HOUR).padStart(2, "0")}:00에 다시 열려요
        </span>
        <button
          type="button"
          disabled
          aria-label="메시지 전송"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-disabled-bg) text-(--color-disabled-text)"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
