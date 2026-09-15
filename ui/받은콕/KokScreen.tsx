"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Heart } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { Button } from "@ui/공통/Button";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";
import { TabBarMain } from "@ui/공통/TabBar";
import { Toast } from "@ui/공통/Toast";
import {
  cancelCook,
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
  const [cancelTarget, setCancelTarget] = useState<CookItemResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const handleCancelCook = async () => {
    if (!cancelTarget) return;

    setIsCancelling(true);
    try {
      await cancelCook(cancelTarget.cookId);
      setCancelTarget(null);
      setToastMessage("콕을 취소했어요.");
      await loadCooks();
    } catch (cancelError) {
      setToastMessage(cookErrorMessage(cancelError));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <PhoneFrame>
      <Toast
        open={toastMessage !== null}
        message={toastMessage ?? ""}
        onDismiss={() => setToastMessage(null)}
      />

      <header className="flex h-14 w-full shrink-0 items-center gap-2 bg-(--color-surface) px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--color-accent-soft) text-(--color-accent)">
          <Heart className="h-4 w-4" fill="currentColor" />
        </span>
        <h1 className="text-lg font-bold text-(--color-text-strong)">
          {tab === "sent" ? "보낸 콕" : "받은 콕"}
        </h1>
      </header>

      <TabBarMain className="gap-4 px-4 pb-4">
        <TabToggle tab={tab} onChange={handleTabChange} />

        <Notice
          headline={
            tab === "sent" ? "상대방이 콕을 보내면 매칭돼요" : "맞콕하면 바로 매칭돼요"
          }
        />

        {isLoading ? <ScreenMessage>콕 목록을 불러오는 중...</ScreenMessage> : null}

        {!isLoading && error ? (
          <ScreenMessage error>
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => void loadCooks()}>
              다시 시도
            </Button>
          </ScreenMessage>
        ) : null}

        {!isLoading && !error && data && tab === "sent" ? (
          <SentKokPanel cooks={data.sent} onCancel={setCancelTarget} />
        ) : null}

        {!isLoading && !error && data && tab === "received" ? (
          <ReceivedKokPanel
            cooks={data.received}
            sendingUserId={sendingUserId}
            onSend={handleSendCook}
          />
        ) : null}
      </TabBarMain>

      <BottomSheet
        open={cancelTarget !== null}
        onClose={() => !isCancelling && setCancelTarget(null)}
      >
        {cancelTarget ? (
          <CancelKokSheet
            cook={cancelTarget}
            isSubmitting={isCancelling}
            onKeep={() => setCancelTarget(null)}
            onCancelCook={() => void handleCancelCook()}
          />
        ) : null}
      </BottomSheet>
    </PhoneFrame>
  );
}

/**
 * 이 화면에서 가장 큰 요소. 화면 전체가 "두 목록 중 어느 쪽을 보는가"라서
 * 전환 자체를 제일 크게 둔다.
 */
function TabToggle({ tab, onChange }: { tab: KokTab; onChange: (next: KokTab) => void }) {
  const tabs: { key: KokTab; label: string }[] = [
    { key: "sent", label: "보낸 콕" },
    { key: "received", label: "받은 콕" },
  ];

  return (
    <div
      role="tablist"
      aria-label="콕 목록"
      className="flex shrink-0 gap-1 rounded-full bg-(--color-surface-alt) p-1.5"
    >
      {tabs.map(({ key, label }) => {
        const active = tab === key;

        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={`flex-1 rounded-full border-2 py-2.5 text-sm font-bold transition-colors ${
              active
                ? "border-(--color-text-strong) bg-(--color-surface) text-(--color-text-strong)"
                : "border-transparent text-(--color-text-muted)"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** 두 탭 모두 "1시간 만료"가 핵심이라 안내 문구를 한 자리에 고정한다. */
function Notice({ headline }: { headline: string }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-(--radius-lg) bg-(--color-primary-light) p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-surface) text-(--color-primary)">
        <Clock className="h-4 w-4" />
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-(--color-primary)">{headline}</span>
        <span className="text-xs text-(--color-text-sub)">
          1시간이 지나면 자동으로 만료됩니다
        </span>
      </div>
    </div>
  );
}

function SectionHead({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-[15px] font-bold text-(--color-text-strong)">{label}</h2>
      <span className="text-sm font-bold text-(--color-accent) tabular-nums">{count}명</span>
    </div>
  );
}

function SentKokPanel({
  cooks,
  onCancel,
}: {
  cooks: CookItemResponse[];
  onCancel: (cook: CookItemResponse) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHead label="내가 콕한 사람" count={cooks.length} />

      {cooks.length === 0 ? (
        <EmptyState emoji="👆" message="아직 콕을 보내지 않았어요" />
      ) : (
        cooks.map((cook) => (
          <SentKokCard key={cook.cookId} cook={cook} onCancel={onCancel} />
        ))
      )}
    </section>
  );
}

function SentKokCard({
  cook,
  onCancel,
}: {
  cook: CookItemResponse;
  onCancel: (cook: CookItemResponse) => void;
}) {
  const matched = cook.status === "matched" && cook.matchId !== null;

  return (
    <KokCard
      cook={cook}
      matched={matched}
      dimmed={cook.status === "expired"}
      status={
        cook.status === "pending" ? (
          <StatusChip tone="waiting">응답 대기 중</StatusChip>
        ) : cook.status === "expired" ? (
          <StatusChip tone="muted">만료됨</StatusChip>
        ) : undefined
      }
    >
      {matched && cook.matchId !== null ? (
        <ChatPill matchId={cook.matchId} />
      ) : cook.status === "pending" ? (
        <button
          type="button"
          onClick={() => onCancel(cook)}
          className="shrink-0 rounded-full border border-(--color-border-strong) px-4 py-2 text-sm font-medium text-(--color-text-sub) active:bg-(--color-surface-alt)"
        >
          취소
        </button>
      ) : null}
    </KokCard>
  );
}

/**
 * 되돌릴 수 없는 행동이라 한 번 확인받는다. 상대가 이미 콕을 봤을 수도 있고,
 * 취소해도 오늘 횟수는 돌아오지 않는다.
 */
function CancelKokSheet({
  cook,
  isSubmitting,
  onKeep,
  onCancelCook,
}: {
  cook: CookItemResponse;
  isSubmitting: boolean;
  onKeep: () => void;
  onCancelCook: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 pt-2">
      <Avatar
        name={cook.profile.nickname}
        size="xl"
        userId={cook.userId}
        photoUrl={cook.profile.photo}
      />

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xl font-bold text-(--color-text-strong)">
          {cook.profile.nickname}님에게 보낸 콕을 취소할까요?
        </p>
        <p className="text-sm text-(--color-text-sub)">
          취소해도 오늘 사용한 횟수는 돌아오지 않아요.
        </p>
      </div>

      <button
        type="button"
        onClick={onCancelCook}
        disabled={isSubmitting}
        className="w-full rounded-(--radius-lg) bg-(--color-danger) py-4 text-base font-bold text-(--color-text-on-primary) disabled:bg-(--color-disabled-bg) disabled:text-(--color-disabled-text)"
      >
        {isSubmitting ? "취소하는 중..." : "콕 취소하기"}
      </button>
      <button
        type="button"
        onClick={onKeep}
        disabled={isSubmitting}
        className="text-sm text-(--color-text-sub) disabled:text-(--color-disabled-text)"
      >
        그대로 둘게요
      </button>
    </div>
  );
}

const CHIP_TONES = {
  waiting: "bg-(--color-waiting-soft) text-(--color-waiting)",
  done: "bg-(--color-primary-light) text-(--color-primary)",
  muted: "bg-(--color-disabled-bg) text-(--color-text-muted)",
};

function StatusChip({
  tone,
  icon,
  children,
}: {
  tone: keyof typeof CHIP_TONES;
  /** 없으면 점을 찍는다. 시간처럼 뜻이 있는 건 아이콘을 넘긴다. */
  icon?: React.ReactNode;
  children: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${CHIP_TONES[tone]}`}
    >
      {icon ?? (
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

/** "42분 뒤 만료" — 맞콕할 시간이 얼마 남았는지. */
function formatExpiry(sentAt: string) {
  const date = new Date(sentAt);
  if (Number.isNaN(date.getTime())) return "곧 만료돼요";

  const minutes = Math.ceil((date.getTime() + 60 * 60 * 1000 - Date.now()) / 60_000);
  return minutes > 0 ? `${minutes}분 뒤 만료` : "곧 만료돼요";
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
  const active = cooks.filter((cook) => cook.status !== "expired");
  const expired = cooks.filter((cook) => cook.status === "expired");

  return (
    <>
      <section className="flex flex-col gap-3">
        <SectionHead label="나를 콕한 사람" count={active.length} />

        {active.length === 0 ? (
          <EmptyState
            emoji="💌"
            message="아직 받은 콕이 없어요"
            hint="먼저 콕을 보내면 답이 올 확률이 높아요"
          />
        ) : (
          active.map((cook) => {
            const matched = cook.status === "matched" && cook.matchId !== null;

            return (
              <KokCard
                key={cook.cookId}
                cook={cook}
                matched={matched}
                status={
                  matched ? undefined : (
                    <StatusChip tone="waiting" icon={<Clock className="h-3 w-3" />}>
                      {formatExpiry(cook.sentAt)}
                    </StatusChip>
                  )
                }
              >
                {matched && cook.matchId !== null ? (
                  <ChatPill matchId={cook.matchId} />
                ) : cook.status === "pending" ? (
                  <KokBackButton
                    sending={sendingUserId === cook.userId}
                    onClick={() => void onSend(cook.userId)}
                  />
                ) : null}
              </KokCard>
            );
          })
        )}
      </section>

      {expired.length > 0 ? (
        <section className="flex flex-col gap-3">
          {/* 홈·마이페이지의 "받은 콕"은 만료된 것까지 센다. 여기서 나뉜 두 숫자를
              더하면 그 값이 되도록 이쪽에도 개수를 적는다. */}
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold text-(--color-text-muted)">놓친 콕</h2>
            <span className="text-sm font-bold text-(--color-text-muted) tabular-nums">
              {expired.length}명
            </span>
          </div>
          {expired.map((cook) => (
            <KokCard
              key={cook.cookId}
              cook={cook}
              dimmed
              status={<StatusChip tone="muted">만료됨</StatusChip>}
            >
              {null}
            </KokCard>
          ))}
        </section>
      ) : null}
    </>
  );
}

/**
 * 두 탭이 같은 카드를 쓴다 — 사람 정보는 같고 상태에 따라 껍데기와 오른쪽
 * 버튼만 달라진다.
 */
function KokCard({
  cook,
  matched = false,
  dimmed = false,
  status,
  children,
}: {
  cook: CookItemResponse;
  /** 매칭된 상대는 카드 전체를 보라 계열로 물들여 목록에서 바로 눈에 띄게 한다. */
  matched?: boolean;
  dimmed?: boolean;
  /** 부가 정보 아래에 붙는 상태 칩. */
  status?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-[1.25rem] border ${
        matched
          ? "border-(--color-primary-light) bg-(--color-primary-lighter)"
          : "border-(--color-border) bg-(--color-surface)"
      } ${dimmed ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3 p-4">
        <Avatar
          name={cook.profile.nickname}
          size="lg"
          userId={cook.userId}
          badge={matched ? "💕" : undefined}
          photoUrl={cook.profile.photo}
        />

        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-bold text-(--color-text-strong)">
              {cook.profile.nickname}
            </span>
            <Tag variant="accent">{cook.profile.mbti}</Tag>
          </div>
          <span className="truncate text-[13px] text-(--color-text-sub)">
            {[`${cook.profile.age}세`, cook.profile.department].filter(Boolean).join(" · ")}
          </span>
          {status ? <div className="mt-1.5">{status}</div> : null}
        </div>

        {children}
      </div>

      <Link
        href={`/profile/${cook.userId}`}
        className={`border-t px-4 py-2.5 text-[13px] text-(--color-text-sub) ${
          matched ? "border-(--color-primary-light)" : "border-(--color-border)"
        }`}
      >
        프로필 보기
      </Link>
    </article>
  );
}

/** 매칭된 상대에게 가는 길. 이 화면에서 가장 중요한 행동이라 꽉 채운다. */
function ChatPill({ matchId }: { matchId: number }) {
  return (
    <Link
      href={`/match/${matchId}`}
      className="shrink-0 rounded-full bg-(--color-primary) px-4 py-2.5 text-sm font-bold text-(--color-text-on-primary) transition-colors active:bg-(--color-primary-pressed)"
    >
      채팅 열기
    </Link>
  );
}

/** 맞콕은 매칭을 만드는 행동이라 콕 색(산호)으로 구분한다. */
function KokBackButton({
  sending,
  onClick,
}: {
  sending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={sending}
      onClick={onClick}
      className="flex shrink-0 items-center gap-1 rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-bold text-(--color-text-on-primary) disabled:bg-(--color-disabled-bg) disabled:text-(--color-disabled-text)"
    >
      {sending ? "보내는 중" : "맞콕하기"}
      {sending ? null : <span aria-hidden="true">👆</span>}
    </button>
  );
}

/** 빈 화면은 다음에 할 일을 알려주는 자리다. */
function EmptyState({
  emoji,
  message,
  hint,
}: {
  emoji: string;
  message: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <span className="text-4xl" aria-hidden="true">
        {emoji}
      </span>
      <p className="text-sm text-(--color-text-sub)">{message}</p>
      {hint ? <p className="text-xs text-(--color-text-muted)">{hint}</p> : null}
      <Link
        href="/explore"
        className="mt-2 rounded-full bg-(--color-primary) px-5 py-2.5 text-sm font-bold text-(--color-text-on-primary)"
      >
        참가자 둘러보기
      </Link>
    </div>
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
