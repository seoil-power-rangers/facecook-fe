"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Heart, MessageCircle, Ticket } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { avatarColor, avatarEmoji, defaultPhotoForGender } from "@ui/공통/avatarColor";
import { getMyProfile, type ProfileResponse } from "@ui/프로필작성/profileApi";
import { getMatch, matchErrorMessage, type MatchResponse } from "./matchApi";

export function MatchedCelebrationScreen({ matchId }: { matchId: string }) {
  const router = useRouter();
  const numericMatchId = Number(matchId);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [me, setMe] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatch = useCallback(async () => {
    if (!Number.isInteger(numericMatchId) || numericMatchId <= 0) {
      setError("올바르지 않은 주소예요.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // 두 얼굴을 나란히 보여주려면 내 프로필도 있어야 한다.
      const [detail, mine] = await Promise.all([
        getMatch(numericMatchId),
        getMyProfile(),
      ]);
      setMatch(detail);
      setMe(mine);
    } catch (loadError) {
      setError(matchErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [numericMatchId]);

  useEffect(() => {
    // 라우트의 matchId가 바뀌면 해당 매칭 상세를 다시 불러온다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMatch();
  }, [loadMatch]);

  if (isLoading || error || !match) {
    return (
      <PhoneFrame>
        <header className="flex h-14 shrink-0 items-center px-3">
          <button
            type="button"
            aria-label="뒤로가기"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-surface-alt) text-(--color-text-strong)"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </header>
        <div
          role={error ? "alert" : undefined}
          className={`flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm ${
            error ? "text-(--color-danger)" : "text-(--color-text-sub)"
          }`}
        >
          <span>{error ?? "불러오는 중..."}</span>
          {error ? (
            <Button size="sm" variant="outline" onClick={() => void loadMatch()}>
              다시 시도
            </Button>
          ) : null}
        </div>
      </PhoneFrame>
    );
  }

  const partner = match.partner;
  const interests = partner.hobby
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean);

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <section
          className="relative flex shrink-0 flex-col items-center gap-5 overflow-hidden px-6 pb-14 pt-3 text-center text-(--color-hero-text)"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--color-celebrate-from), var(--color-celebrate-to))",
          }}
        >
          <Confetti />
          <div className="relative z-10 flex w-full items-center">
            <button
              type="button"
              aria-label="뒤로가기"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-(--color-hero-text)"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <FaceOff me={me} partner={partner} />

          <div className="relative z-10 flex flex-col gap-1.5">
            <p className="text-3xl font-extrabold leading-tight text-balance">
              {partner.nickname}님이랑
              <br />
              매칭됐어요
            </p>
            <p className="text-sm text-white/80">서로 콕해서 채팅방이 열렸어요</p>
          </div>
        </section>

        {/*
          시트가 히어로 위로 20px 올라오므로, 위쪽 여백은 그만큼 더 줘야
          카드가 히어로 경계에 붙지 않는다. p-5로 두면 정확히 0이 된다.
        */}
        <div className="-mt-5 flex flex-1 flex-col gap-5 rounded-t-[1.75rem] bg-(--color-surface) px-5 pb-5 pt-11">
          {/*
            여기에 미션 내용을 적어두면 안 된다. 기능명세 5절이 "미션 내용은
            별도 리스트 전달받지 않음 — 운영진이 현장 판단"이라, 화면이 지어낸
            문구는 부스에서 실제로 시키는 것과 어긋난다. 미션 화면으로 보낸다.
          */}
          <Link
            href={`/match/${match.matchId}/mission`}
            className="flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-alt) p-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
              <Ticket className="h-5 w-5" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-sm font-bold text-(--color-text-strong)">
                미션이 열렸어요
              </span>
              <span className="text-xs text-(--color-text-sub)">
                부스에서 함께 수행하고 선물을 받아가세요
              </span>
            </span>
          </Link>

          {interests.length > 0 ? (
            <div className="flex flex-col gap-2">
              {/* 취미를 그냥 나열하지 않고 "무슨 말을 걸까"에 대한 답으로 준다. */}
              <p className="text-sm font-bold text-(--color-text-strong)">
                이런 얘기로 시작해보세요
              </p>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full bg-(--color-accent-soft) px-3 py-1.5 text-xs font-medium text-(--color-accent)"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex-1" />

          <div className="flex flex-col items-center gap-2">
            <Link
              href={`/match/${match.matchId}`}
              className="flex h-[54px] w-full items-center justify-center gap-2 rounded-(--radius-lg) bg-(--color-accent) text-base font-bold text-(--color-text-on-primary)"
            >
              <MessageCircle className="h-4 w-4" />
              채팅 시작하기
            </Link>
            <p className="text-xs text-(--color-text-muted)">
              채팅방은 서비스 종료까지 남아 있어요
            </p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/**
 * 두 얼굴이 양옆에서 모여들고 가운데 하트가 터진다.
 *
 * 앱에서 연출을 쓰는 유일한 자리다 — 매칭은 이 앱에서 가장 좋은 소식이라
 * 한 번은 크게 축하할 값어치가 있다. 모션 줄이기를 켠 기기에서는
 * globals.css의 가드가 이 연출을 걷어낸다.
 */
function FaceOff({
  me,
  partner,
}: {
  me: ProfileResponse | null;
  partner: ProfileResponse;
}) {
  return (
    <div className="relative z-10 flex items-center justify-center py-2">
      <Face
        userId={me?.userId ?? null}
        label={me?.nickname ?? "나"}
        photoUrl={me?.photo}
        gender={me?.gender}
        className="-mr-1.5 animate-[match-in-left_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
      />
      <Face
        userId={partner.userId}
        label={partner.nickname}
        photoUrl={partner.photo}
        gender={partner.gender}
        className="-ml-1.5 animate-[match-in-right_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
      />
      <span
        className="absolute z-20 flex h-11 w-11 animate-[match-pop_0.35s_cubic-bezier(0.34,1.56,0.64,1)_0.4s_both] items-center justify-center rounded-full bg-(--color-surface) shadow-(--shadow-card)"
        aria-hidden="true"
      >
        <Heart className="h-5 w-5 text-(--color-accent)" fill="currentColor" />
      </span>
    </div>
  );
}

/** 배경에 떠 있는 옅은 원. 그라데이션만 있으면 밋밋해서 깊이만 더한다. */
function Confetti() {
  const dots = [
    "left-6 top-10 h-3 w-3",
    "right-10 top-6 h-2 w-2",
    "right-6 top-28 h-4 w-4",
    "left-12 bottom-10 h-2.5 w-2.5",
    "right-16 bottom-6 h-3 w-3",
  ];

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {dots.map((dot) => (
        <span key={dot} className={`absolute rounded-full bg-white/25 ${dot}`} />
      ))}
    </div>
  );
}

function Face({
  userId,
  label,
  photoUrl,
  gender,
  className,
}: {
  userId: number | null;
  label: string;
  photoUrl?: string | null;
  gender?: string | null;
  className: string;
}) {
  const fallbackPhoto =
    photoUrl || (gender ? defaultPhotoForGender(gender) : null);

  return (
    <span
      role="img"
      aria-label={label}
      className={`relative z-10 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-5xl ring-4 ring-white/35 ${className}`}
      style={
        fallbackPhoto
          ? undefined
          : {
              backgroundColor:
                userId === null ? "var(--color-primary-light)" : avatarColor(userId),
            }
      }
    >
      {fallbackPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element -- 프로필 URL·기본 실루엣이라 next/image 대상이 아니다.
        <img src={fallbackPhoto} alt="" className="h-full w-full object-cover" />
      ) : userId === null ? (
        <span className="text-2xl font-bold text-(--color-primary)">나</span>
      ) : (
        avatarEmoji(userId)
      )}
    </span>
  );
}
