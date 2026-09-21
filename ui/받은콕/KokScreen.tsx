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
import { clearLegacyRejectedCooks } from "./legacyRejectedCooks";
import {
  cancelCook,
  cookErrorCode,
  cookErrorMessage,
  getCooks,
  rejectCook,
  rejectErrorMessage,
  sendCook,
  type CookItemResponse,
  type CookListResponse,
} from "./cookApi";
import { track } from "@ui/공통/analytics";
import {
  dropReceivedCookFromLiveBadges,
  refreshLiveBadgesNow,
  replaceCooksInLiveBadges,
} from "@ui/공통/liveBadgesStore";
import { createRequestSequence } from "@ui/공통/requestSequence";

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
  /** 거절을 확인받는 중인 콕. 시트에 상대 얼굴과 이름을 띄운다. */
  const [rejectTarget, setRejectTarget] = useState<CookItemResponse | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<CookItemResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  /**
   * 목록 조회의 순번표. 조회가 여러 개 겹치면 가장 최근에 시작한 응답만 화면에 반영한다 — 거절로 지운
   * 카드를 그보다 먼저 시작한 오래된 응답이 되살리지 못하게 하기 위해서다.
   */
  const [listRequests] = useState(createRequestSequence);

  /**
   * 콕 목록을 서버에서 다시 불러온다.
   *
   * 기본은 화면 전체 로딩을 켜고 실패하면 오류 화면을 보여 준다(처음 진입·다시 시도). `background`이면
   * 기존 목록을 그대로 두고 새 결과로만 바꾸며, 실패해도 목록을 유지한 채 결과만 돌려준다 — 거절 결과를
   * 확인하려고 다시 불러오는 동안 카드가 사라지면 안 되기 때문이다.
   *
   * 부작용: 이전에 시작한 조회는 응답이 와도 반영되지 않는다. `onLoaded`는 이 조회가 여전히 최신이라
   * 결과를 반영할 때만 불린다(예: 같은 결과를 배지 스토어에도 넘길 때).
   *
   * @returns 반영했으면 `loaded`, 실패했으면 `failed`, 더 최근 조회가 있어 버려졌으면 `superseded`.
   */
  const loadCooks = useCallback(
    async ({
      background = false,
      onLoaded,
    }: { background?: boolean; onLoaded?: (cooks: CookListResponse) => void } = {}) => {
      const requestId = listRequests.begin();
      if (!background) {
        setIsLoading(true);
        setError(null);
      }
      try {
        const next = await getCooks();
        if (!listRequests.isLatest(requestId)) return "superseded" as const;
        setData(next);
        setError(null);
        onLoaded?.(next);
        return "loaded" as const;
      } catch (loadError) {
        if (!listRequests.isLatest(requestId)) return "superseded" as const;
        if (!background) setError(cookErrorMessage(loadError));
        return "failed" as const;
      } finally {
        if (listRequests.isLatest(requestId)) setIsLoading(false);
      }
    },
    [listRequests],
  );

  useEffect(() => {
    const stored = sessionStorage.getItem(KOK_TAB_STORAGE_KEY);
    if (stored === "sent" || stored === "received") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab(stored);
    }
    void loadCooks();
    // 서버에 거절이 생기기 전에 브라우저에 남겼던 거절 기록은 버린다. 거절 여부는 서버 목록으로 판단한다.
    clearLegacyRejectedCooks();
    // 화면을 떠난 뒤에 도착한 응답이 상태를 바꾸지 않게 한다.
    return () => listRequests.invalidate();
  }, [loadCooks, listRequests]);

  const handleTabChange = (next: KokTab) => {
    setTab(next);
    sessionStorage.setItem(KOK_TAB_STORAGE_KEY, next);
  };

  /**
   * 받은 콕을 거절한다. 서버가 거절을 기록했다고 응답한 뒤에만 카드를 지운다.
   *
   * 성공하면 진행 중이던 목록 조회를 무효화하고(그 응답이 방금 지운 카드를 되살리지 못하게) 카드를 지운 뒤
   * 배지를 서버 기준으로 다시 계산한다. 실패하면 그 실패만으로 카드를 남기거나 지우지 않는다 — 보낸 사람이
   * 먼저 취소했거나 연결이 끊겨 결과를 모를 수 있으므로 서버 목록을 다시 불러와 맞춘다.
   */
  const handleReject = async () => {
    if (!rejectTarget || isRejecting) return;
    const target = rejectTarget;

    setIsRejecting(true);
    let rejectFailed = false;
    try {
      await rejectCook(target.cookId);
      listRequests.invalidate();
      setIsLoading(false);
      setData((current) =>
        current
          ? { ...current, received: current.received.filter((cook) => cook.cookId !== target.cookId) }
          : current,
      );
      setRejectTarget(null);
      setToastMessage("콕을 거절했어요.");
      refreshLiveBadgesNow();
      dropReceivedCookFromLiveBadges(target.cookId);
    } catch (rejectError) {
      rejectFailed = true;
      track({
        name: "cook_failed",
        props: { code: cookErrorCode(rejectError), from: "kok" },
      });
      setRejectTarget(null);
      setToastMessage(rejectErrorMessage(rejectError));
      refreshLiveBadgesNow();
    } finally {
      setIsRejecting(false);
    }

    // 실패한 이유가 무엇이든 서버 상태는 화면과 다를 수 있다. 시트를 닫은 뒤 백그라운드로 맞추고, 그
    // 결과를 배지에도 전달한다(킬스위치가 꺼져 있으면 배지 조회가 나가지 않는다).
    if (
      rejectFailed &&
      (await loadCooks({ background: true, onLoaded: replaceCooksInLiveBadges })) === "failed"
    ) {
      setToastMessage("콕 목록을 확인하지 못했어요. 잠시 후 다시 확인해주세요.");
    }
  };

  const handleSendCook = async (userId: number) => {
    setSendingUserId(userId);
    try {
      const result = await sendCook(userId);
      track({ name: "cook_sent", props: { from: "kok" } });
      if (result.matched) track({ name: "match_created" });
      if (result.matched && result.matchId !== null) {
        router.push(`/match/${result.matchId}/matched`);
        return;
      }
      setToastMessage("콕을 보냈어요.");
      await loadCooks();
    } catch (sendError) {
      track({
        name: "cook_failed",
        props: { code: cookErrorCode(sendError), from: "kok" },
      });
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
      refreshLiveBadgesNow();
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
            cooks={data.received.filter((cook) => cook.status !== "rejected")}
            sendingUserId={sendingUserId}
            onSend={handleSendCook}
            onReject={setRejectTarget}
          />
        ) : null}
      </TabBarMain>

      <BottomSheet
        open={rejectTarget !== null}
        onClose={() => !isRejecting && setRejectTarget(null)}
      >
        {rejectTarget ? (
          <RejectKokSheet
            cook={rejectTarget}
            isSubmitting={isRejecting}
            onKeep={() => setRejectTarget(null)}
            onReject={() => void handleReject()}
          />
        ) : null}
      </BottomSheet>

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

/** 두 탭 모두 맞콕하면 바로 매칭된다는 안내를 한 자리에 고정한다. */
function Notice({ headline }: { headline: string }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-(--radius-lg) bg-(--color-primary-light) p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-surface) text-(--color-primary)">
        <Clock className="h-4 w-4" />
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-(--color-primary)">{headline}</span>
        <span className="text-xs text-(--color-text-sub)">
          상대가 맞콕하거나 취소할 때까지 유지돼요
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

/**
 * 보낸 콕의 상태 표시. 거절당한 콕은 "거절됨"으로 보이고 취소 버튼이 없다(서버도 거절된 콕의 취소를
 * 막는다). 레거시 `expired`는 응답을 기다리는 것처럼 보이지 않게 따로 표시한다.
 */
function sentStatusChip(status: CookItemResponse["status"]) {
  if (status === "pending") return <StatusChip tone="waiting">응답 대기 중</StatusChip>;
  if (status === "rejected") return <StatusChip tone="muted">거절됨</StatusChip>;
  if (status === "expired") return <StatusChip tone="muted">만료됨</StatusChip>;
  return undefined;
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
      status={sentStatusChip(cook.status)}
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
 * 거절도 한 번 확인받는다. 맞콕 버튼 바로 옆이라 손가락으로 잘못 누르기 쉽고,
 * 되돌릴 방법을 두지 않기로 했다. 서버 응답을 기다리는 동안은 두 번 눌러도 요청이 한 번만
 * 나가도록 버튼을 잠근다.
 */
function RejectKokSheet({
  cook,
  isSubmitting,
  onKeep,
  onReject,
}: {
  cook: CookItemResponse;
  isSubmitting: boolean;
  onKeep: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 pt-2">
      <Avatar
        name={cook.profile.nickname}
        size="xl"
        userId={cook.userId}
        photoUrl={cook.profile.photo}
        gender={cook.profile.gender}
      />

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xl font-bold text-(--color-text-strong)">
          {cook.profile.nickname}님의 콕을 거절할까요?
        </p>
      </div>

      <button
        type="button"
        onClick={onReject}
        disabled={isSubmitting}
        className="w-full rounded-(--radius-lg) bg-(--color-danger) py-4 text-base font-bold text-(--color-text-on-primary) disabled:opacity-60"
      >
        {isSubmitting ? "거절하는 중..." : "거절하기"}
      </button>
      <button
        type="button"
        onClick={onKeep}
        disabled={isSubmitting}
        className="text-sm text-(--color-text-sub) disabled:opacity-60"
      >
        그대로 둘게요
      </button>
    </div>
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
        gender={cook.profile.gender}
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


function ReceivedKokPanel({
  cooks,
  sendingUserId,
  onSend,
  onReject,
}: {
  cooks: CookItemResponse[];
  sendingUserId: number | null;
  onSend: (userId: number) => Promise<void>;
  onReject: (cook: CookItemResponse) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHead label="나를 콕한 사람" count={cooks.length} />

      {cooks.length === 0 ? (
        <EmptyState
          emoji="💌"
          message="아직 받은 콕이 없어요"
          hint="먼저 콕을 보내면 답이 올 확률이 높아요"
        />
      ) : (
        cooks.map((cook) => {
          const matched = cook.status === "matched" && cook.matchId !== null;

          return (
            <KokCard
              key={cook.cookId}
              cook={cook}
              matched={matched}
              status={
                /*
                  기다리는 중이라는 칩은 두지 않는다. 바로 아래 [맞콕하기]가
                  이미 하는 말이고, 화면 위 안내문까지 치면 같은 얘기를 세 번
                  하는 셈이다. 만료는 버튼이 사라지는 자리라 칩이 유일한
                  단서이므로 남긴다.
                */
                cook.status === "expired" ? (
                  <StatusChip tone="muted">만료됨</StatusChip>
                ) : undefined
              }
            >
              {matched && cook.matchId !== null ? (
                <ChatPill matchId={cook.matchId} />
              ) : cook.status === "pending" ? (
                <div className="flex shrink-0 items-center gap-1">
                  {/*
                    거절은 맞콕과 무게를 달리한다. 같은 크기로 나란히 두면
                    고르기를 망설이게 되고, 이 화면에서 바라는 건 맞콕이다.
                  */}
                  <button
                    type="button"
                    onClick={() => onReject(cook)}
                    className="shrink-0 rounded-full px-3 py-2.5 text-sm font-medium text-(--color-text-sub) active:bg-(--color-surface-alt)"
                  >
                    거절
                  </button>
                  <KokBackButton
                    sending={sendingUserId === cook.userId}
                    onClick={() => void onSend(cook.userId)}
                  />
                </div>
              ) : null}
            </KokCard>
          );
        })
      )}
    </section>
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
  /** 아래 띠에 놓이는 행동 버튼. */
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
          gender={cook.profile.gender}
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
      </div>

      {/*
        신원과 행동을 층으로 나눈다. 한 줄에 같이 두면 이름·학과와 버튼이
        폭을 두고 다투다가, 버튼이 하나 늘어난 순간 가운데 글자가 줄줄이
        접힌다. 위층은 누구인지만, 아래층은 무엇을 할지만 맡는다.
      */}
      <div
        className={`flex items-center justify-between gap-2 border-t px-4 py-2 ${
          matched ? "border-(--color-primary-light)" : "border-(--color-border)"
        }`}
      >
        <Link
          href={`/profile/${cook.userId}`}
          className="shrink-0 py-1.5 text-[13px] text-(--color-text-sub)"
        >
          프로필 보기
        </Link>
        {children}
      </div>
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
