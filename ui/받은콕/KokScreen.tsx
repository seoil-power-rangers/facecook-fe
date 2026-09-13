"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Sparkles } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";
import { TabBarMain } from "@ui/공통/TabBar";
import { Toast } from "@ui/공통/Toast";
import { avatarColor } from "@ui/공통/avatarColor";
import {
  cookErrorMessage,
  getCooks,
  sendCook,
  type CookItemResponse,
  type CookListResponse,
} from "./cookApi";

type KokTab = "sent" | "received";

const KOK_TAB_STORAGE_KEY = "kok-tab";
export function KokScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<KokTab>("received");
  const [data, setData] = useState<CookListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingUserId, setSendingUserId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadCooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getCooks());
    } catch (loadError) {
      setError(cookErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(KOK_TAB_STORAGE_KEY);
    if (stored === "sent" || stored === "received") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab(stored);
    }
    void loadCooks();
  }, [loadCooks]);

  const handleTabChange = (next: KokTab) => {
    setTab(next);
    sessionStorage.setItem(KOK_TAB_STORAGE_KEY, next);
  };

  const handleSendCook = async (userId: number) => {
    setSendingUserId(userId);
    try {
      const result = await sendCook(userId);
      if (result.matched && result.matchId !== null) {
        router.push(`/match/${result.matchId}/matched`);
        return;
      }
      setToastMessage("콕을 보냈어요.");
      await loadCooks();
    } catch (sendError) {
      setToastMessage(cookErrorMessage(sendError));
    } finally {
      setSendingUserId(null);
    }
  };

  return (
    <PhoneFrame>
      <Toast
        open={toastMessage !== null}
        message={toastMessage ?? ""}
        onDismiss={() => setToastMessage(null)}
      />

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

      <TabBarMain>
        {isLoading ? <ScreenMessage>콕 목록을 불러오는 중...</ScreenMessage> : null}
        {!isLoading && error ? (
          <ScreenMessage error>
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => void loadCooks()}>
              다시 시도
            </Button>
          </ScreenMessage>
        ) : null}
        {!isLoading && !error && data && tab === "sent" ? <SentKokPanel data={data} /> : null}
        {!isLoading && !error && data && tab === "received" ? (
          <ReceivedKokPanel
            cooks={data.received}
            sendingUserId={sendingUserId}
            onSend={handleSendCook}
          />
        ) : null}
      </TabBarMain>
    </PhoneFrame>
  );
}

function ScreenMessage({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div
      role={error ? "alert" : undefined}
      className={`flex flex-col items-center gap-3 px-6 py-20 text-center text-sm ${
        error ? "text-(--color-danger)" : "text-(--color-text-sub)"
      }`}
    >
      {children}
    </div>
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-(--color-surface) text-(--color-text-strong) shadow-(--shadow-card)"
          : "text-(--color-text-sub)"
      }`}
    >
      {children}
    </button>
  );
}

function SentKokPanel({ data }: { data: CookListResponse }) {
  const usageRatio = Math.min(
    100,
    (data.usage.todayUsed / Math.max(data.usage.dailyLimit, 1)) * 100,
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-(--color-text-strong)">오늘 보낸 콕</h2>
        <span className="text-xs text-(--color-text-sub)">
          {data.usage.dailyLimit}회 중 {data.usage.todayUsed}회 사용
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-(--color-disabled-bg)">
        <div
          className="h-full rounded-full bg-(--color-primary)"
          style={{ width: `${usageRatio}%` }}
        />
      </div>

      {data.sent.length === 0 ? (
        <p className="py-8 text-center text-sm text-(--color-text-sub)">아직 보낸 콕이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.sent.map((cook) => (
            <SentKokCard key={cook.cookId} cook={cook} />
          ))}
        </div>
      )}

    </div>
  );
}

const sentStatusTag = {
  pending: { label: "승인 대기", variant: "default" as const },
  expired: { label: "만료됨", variant: "default" as const },
  matched: { label: "매칭 완료", variant: "primary" as const },
};

function SentKokCard({ cook }: { cook: CookItemResponse }) {
  const note =
    cook.status === "pending"
      ? `${formatRemaining(cook.sentAt)} · 상대가 콕하면 매칭돼요`
      : cook.status === "expired"
        ? "맞콕 없이 만료됐어요"
        : "서로 콕해 매칭됐어요";

  return (
    <div
      className={`flex flex-col gap-2 rounded-(--radius-lg) border bg-(--color-surface) p-3 ${
        cook.status === "pending" ? "border-(--color-border-active)" : "border-(--color-border)"
      } ${cook.status === "expired" ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3">
        <Link href={`/profile/${cook.userId}`}>
          <Avatar name={cook.profile.nickname} size="lg" bgColor={avatarColor(cook.userId)} />
        </Link>
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-(--color-text-strong)">
              {cook.profile.nickname}
            </span>
            <Tag variant={sentStatusTag[cook.status].variant}>{sentStatusTag[cook.status].label}</Tag>
          </div>
          <span className="truncate text-xs text-(--color-text-sub)">{formatDateTime(cook.sentAt)}에 보냄</span>
        </div>
        {cook.status === "matched" && cook.matchId !== null ? (
          <Link href={`/match/${cook.matchId}`}>
            <Button size="sm">채팅 열기</Button>
          </Link>
        ) : null}
      </div>

      {cook.status === "pending" ? (
        <div className="h-1.5 w-full rounded-full bg-(--color-disabled-bg)">
          <div
            className="h-full rounded-full bg-(--color-primary)"
            style={{ width: `${getRemainingRatio(cook.sentAt) * 100}%` }}
          />
        </div>
      ) : null}

      <div className="flex items-center gap-1 text-xs text-(--color-text-sub)">
        {cook.status === "pending" ? <Clock className="h-3 w-3" /> : null}
        {note}
      </div>
    </div>
  );
}

function ReceivedKokPanel({
  cooks,
  sendingUserId,
  onSend,
}: {
  cooks: CookItemResponse[];
  sendingUserId: number | null;
  onSend: (userId: number) => Promise<void>;
}) {
  const activeCooks = cooks.filter((cook) => cook.status !== "expired");
  const expiredCooks = cooks.filter((cook) => cook.status === "expired");

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

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-(--color-text-strong)">나를 콕한 사람</h2>
          <span className="text-xs text-(--color-text-sub)">{activeCooks.length}명</span>
        </div>
        {activeCooks.length === 0 ? (
          <p className="py-8 text-center text-sm text-(--color-text-sub)">아직 받은 콕이 없어요.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {activeCooks.map((cook, index) => (
              <ReceivedKokCard
                key={cook.cookId}
                cook={cook}
                highlight={index === 0}
                sending={sendingUserId === cook.userId}
                onSend={onSend}
              />
            ))}
          </div>
        )}
      </section>

      {expiredCooks.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-(--color-text-strong)">만료된 콕</h2>
          <div className="flex flex-col gap-3">
            {expiredCooks.map((cook) => (
              <div
                key={cook.cookId}
                className="flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 opacity-60"
              >
                <Link href={`/profile/${cook.userId}`}>
                  <Avatar name={cook.profile.nickname} size="lg" bgColor={avatarColor(cook.userId)} />
                </Link>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate text-sm font-semibold text-(--color-text-strong)">
                    {cook.profile.nickname}
                  </span>
                  <span className="truncate text-xs text-(--color-text-sub)">{profileSubInfo(cook)}</span>
                </div>
                <span className="shrink-0 text-xs text-(--color-text-sub)">만료됨</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ReceivedKokCard({
  cook,
  highlight,
  sending,
  onSend,
}: {
  cook: CookItemResponse;
  highlight: boolean;
  sending: boolean;
  onSend: (userId: number) => Promise<void>;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-(--radius-lg) border bg-(--color-surface) p-3 ${
        highlight ? "border-(--color-border-active)" : "border-(--color-border)"
      }`}
    >
      <div className="flex items-center gap-3">
        <Link href={`/profile/${cook.userId}`}>
          <Avatar name={cook.profile.nickname} size="lg" bgColor={avatarColor(cook.userId)} />
        </Link>
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-(--color-text-strong)">
              {cook.profile.nickname}
            </span>
            <Tag variant="primary">{cook.profile.mbti}</Tag>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-(--color-text-sub)">
            <span className="truncate">{profileSubInfo(cook)}</span>
            {cook.status === "pending" ? (
              <span className="flex shrink-0 items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {formatRemaining(cook.sentAt)}
              </span>
            ) : null}
          </div>
        </div>
        {cook.status === "matched" && cook.matchId !== null ? (
          <Link href={`/match/${cook.matchId}`}>
            <Button size="sm" variant="outline">채팅 열기</Button>
          </Link>
        ) : (
          <Button
            size="sm"
            variant={highlight ? "primary" : "outline"}
            disabled={sending}
            onClick={() => void onSend(cook.userId)}
          >
            {sending ? "보내는 중" : "나도 콕"}
          </Button>
        )}
      </div>
      <div className="border-t border-(--color-border) pt-2">
        <Link href={`/profile/${cook.userId}`} className="text-xs text-(--color-text-sub)">
          프로필 보기
        </Link>
      </div>
    </div>
  );
}

function profileSubInfo(cook: CookItemResponse) {
  return [`${cook.profile.age}세`, cook.profile.department].filter(Boolean).join(" · ");
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value: string) {
  const date = parseDate(value);
  if (!date) return "시간 정보 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRemaining(sentAt: string) {
  const date = parseDate(sentAt);
  if (!date) return "만료 시간 확인 불가";
  const minutes = Math.max(
    0,
    Math.ceil((date.getTime() + 60 * 60 * 1000 - Date.now()) / 60_000),
  );
  return minutes > 0 ? `${minutes}분 남음` : "곧 만료";
}

function getRemainingRatio(sentAt: string) {
  const date = parseDate(sentAt);
  if (!date) return 0;
  return Math.max(
    0,
    Math.min(1, (date.getTime() + 60 * 60 * 1000 - Date.now()) / (60 * 60 * 1000)),
  );
}
