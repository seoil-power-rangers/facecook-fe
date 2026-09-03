"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";
import { TabBar } from "@ui/공통/TabBar";

type KokTab = "sent" | "received";

/** 하단 네비는 항상 /kok으로만 이동해서 URL에 탭을 실어 보낼 수 없다 — 세션 동안은 마지막으로 본 탭을 기억한다. */
const KOK_TAB_STORAGE_KEY = "kok-tab";

interface SentKok {
  id: string;
  name: string;
  bgColor: string;
  status: "pending" | "expired" | "matched";
  sentAt: string;
  note: string;
  remainingRatio?: number;
}

const sentKoks: SentKok[] = [
  {
    id: "1",
    name: "지호",
    bgColor: "#4F46E5",
    status: "pending",
    sentAt: "09:41에 보냄",
    note: "43분 남음 · 상대가 콕하면 매칭돼요",
    remainingRatio: 0.72,
  },
  {
    id: "7",
    name: "서연",
    bgColor: "#9CA3AF",
    status: "expired",
    sentAt: "어제 18:20에 보냄 · 맞콕 없음",
    note: "재신청은 할 수 없어요",
  },
  {
    id: "8",
    name: "유진",
    bgColor: "#F59E0B",
    status: "matched",
    sentAt: "09:12에 보냄 · 09:41 매칭",
    note: "",
  },
];

interface ReceivedKok {
  id: string;
  matchRoomId: string;
  name: string;
  bgColor: string;
  mbti: string;
  subInfo: string;
  commonCount: number;
  remaining: string;
  online?: boolean;
  highlight?: boolean;
}

const receivedKoks: ReceivedKok[] = [
  {
    id: "4",
    matchRoomId: "1",
    name: "유진",
    bgColor: "#F59E0B",
    mbti: "ISFP",
    subInfo: "23세 · 화학과",
    commonCount: 3,
    remaining: "52분 남음",
    online: true,
    highlight: true,
  },
  {
    id: "5",
    matchRoomId: "3",
    name: "도윤",
    bgColor: "#EF4444",
    mbti: "ESTJ",
    subInfo: "25세 · 경제학과",
    commonCount: 1,
    remaining: "11분 남음",
  },
];

const expiredKoks: { id: string; name: string; subInfo: string }[] = [
  { id: "6", name: "태오", subInfo: "24세 · 건축학과 · 어제" },
];

export function KokScreen() {
  const [tab, setTab] = useState<KokTab>("received");

  useEffect(() => {
    const stored = sessionStorage.getItem(KOK_TAB_STORAGE_KEY);
    if (stored === "sent" || stored === "received") {
      // 마운트 직후 한 번, 브라우저에만 있는 값을 React 상태로 들여온다 — 렌더링 중엔 sessionStorage를
      // 읽을 수 없어(서버에 없음) 이 방식이 유일하게 하이드레이션 불일치 없이 복원하는 방법이다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab(stored);
    }
  }, []);

  const handleTabChange = (next: KokTab) => {
    setTab(next);
    sessionStorage.setItem(KOK_TAB_STORAGE_KEY, next);
  };

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-2 border-b border-(--color-border) bg-(--color-surface) px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--color-primary) text-(--color-text-on-primary)">
          <Sparkles className="h-4 w-4" />
        </span>
        <h1 className="text-lg font-bold text-(--color-text-strong)">
          {tab === "sent" ? "보낸 콕" : "받은 콕"}
        </h1>
      </header>

      <div className="flex shrink-0 justify-center border-b border-(--color-border) bg-(--color-surface) py-3">
        <div className="inline-flex rounded-full bg-(--color-disabled-bg) p-1">
          <TabToggleButton active={tab === "sent"} onClick={() => handleTabChange("sent")}>
            보낸 콕
          </TabToggleButton>
          <TabToggleButton active={tab === "received"} onClick={() => handleTabChange("received")}>
            받은 콕
          </TabToggleButton>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-16">
        {tab === "sent" ? <SentKokPanel /> : <ReceivedKokPanel />}
      </main>

      <TabBar />
    </PhoneFrame>
  );
}

function TabToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  let className = "rounded-full px-5 py-2 text-sm font-semibold transition-colors";
  if (active) {
    className += " bg-(--color-surface) text-(--color-text-strong) shadow-(--shadow-card)";
  } else {
    className += " text-(--color-text-sub)";
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function SentKokPanel() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-(--color-text-strong)">오늘 보낸 콕</h2>
        <span className="text-xs text-(--color-text-sub)">3회 중 2회 사용</span>
      </div>

      <div className="flex flex-col gap-3">
        {sentKoks.map((kok) => (
          <SentKokCard key={kok.id} kok={kok} />
        ))}
      </div>

      <div className="rounded-(--radius-lg) bg-(--color-primary-lighter) p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-(--color-text-strong)">행사 전체 콕 사용량</span>
        </div>
        <p className="mt-1 text-lg font-bold text-(--color-text-strong)">5 / 9회</p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-(--color-surface)">
          <div className="h-full rounded-full bg-(--color-primary)" style={{ width: "56%" }} />
        </div>
      </div>
    </div>
  );
}

const sentStatusTag: Record<SentKok["status"], { label: string; variant: "primary" | "default" }> = {
  pending: { label: "승인 대기", variant: "default" },
  expired: { label: "만료됨", variant: "default" },
  matched: { label: "매칭 완료", variant: "primary" },
};

function SentKokCard({ kok }: { kok: SentKok }) {
  const isExpired = kok.status === "expired";

  let containerClassName = "flex flex-col gap-2 rounded-(--radius-lg) border bg-(--color-surface) p-3";
  if (kok.status === "pending") {
    containerClassName += " border-(--color-border-active)";
  } else {
    containerClassName += " border-(--color-border)";
  }
  if (isExpired) {
    containerClassName += " opacity-60";
  }

  const statusTag = sentStatusTag[kok.status];

  return (
    <div className={containerClassName}>
      <div className="flex items-center gap-3">
        <Link href={`/profile/${kok.id}`}>
          <Avatar name={kok.name} size="lg" bgColor={kok.bgColor} />
        </Link>
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-(--color-text-strong)">{kok.name}</span>
            <Tag variant={statusTag.variant}>{statusTag.label}</Tag>
          </div>
          <span className="truncate text-xs text-(--color-text-sub)">{kok.sentAt}</span>
        </div>
        {kok.status === "matched" ? (
          <Link href="/match/1">
            <Button size="sm">채팅 열기</Button>
          </Link>
        ) : null}
      </div>

      {kok.status === "pending" && kok.remainingRatio !== undefined ? (
        <div className="h-1.5 w-full rounded-full bg-(--color-disabled-bg)">
          <div
            className="h-full rounded-full bg-(--color-primary)"
            style={{ width: `${kok.remainingRatio * 100}%` }}
          />
        </div>
      ) : null}

      {kok.note ? (
        <div className="flex items-center gap-1 text-xs text-(--color-text-sub)">
          {kok.status === "pending" ? <Clock className="h-3 w-3" /> : null}
          {kok.note}
        </div>
      ) : null}
    </div>
  );
}

function ReceivedKokPanel() {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-center gap-3 rounded-(--radius-lg) bg-(--color-primary-lighter) p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-surface) text-(--color-primary)">
          <Clock className="h-4 w-4" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-(--color-text-strong)">맞콕하면 바로 매칭돼요</span>
          <span className="text-xs text-(--color-text-sub)">1시간이 지나면 자동으로 만료됩니다</span>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-(--color-text-strong)">나를 콕한 사람</h2>
          <span className="text-xs text-(--color-text-sub)">{receivedKoks.length}명</span>
        </div>

        <div className="flex flex-col gap-3">
          {receivedKoks.map((kok) => (
            <ReceivedKokCard key={kok.id} kok={kok} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-(--color-text-strong)">만료된 콕</h2>
        <div className="flex flex-col gap-3">
          {expiredKoks.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 opacity-60"
            >
              <Link href={`/profile/${person.id}`}>
                <Avatar name={person.name} size="lg" />
              </Link>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-semibold text-(--color-text-strong)">
                  {person.name}
                </span>
                <span className="truncate text-xs text-(--color-text-sub)">{person.subInfo}</span>
              </div>
              <span className="shrink-0 text-xs text-(--color-text-sub)">만료됨</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReceivedKokCard({ kok }: { kok: ReceivedKok }) {
  let containerClassName = "flex flex-col gap-2 rounded-(--radius-lg) border bg-(--color-surface) p-3";
  containerClassName += kok.highlight ? " border-(--color-border-active)" : " border-(--color-border)";

  return (
    <div className={containerClassName}>
      <div className="flex items-center gap-3">
        <Link href={`/profile/${kok.id}`}>
          <Avatar name={kok.name} size="lg" bgColor={kok.bgColor} online={kok.online} />
        </Link>
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-(--color-text-strong)">{kok.name}</span>
            <Tag variant="primary">{kok.mbti}</Tag>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-(--color-text-sub)">
            <span className="truncate">{kok.subInfo}</span>
            <Tag variant="default">공통 {kok.commonCount}개</Tag>
            <span className="flex shrink-0 items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {kok.remaining}
            </span>
          </div>
        </div>
        <Link href={`/match/${kok.matchRoomId}/matched`}>
          <Button size="sm" variant={kok.highlight ? "primary" : "outline"}>
            나도 콕
          </Button>
        </Link>
      </div>

      <div className="border-t border-(--color-border) pt-2">
        <Link href={`/profile/${kok.id}`} className="text-xs text-(--color-text-sub)">
          프로필 보기
        </Link>
      </div>
    </div>
  );
}
