"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, SlidersHorizontal } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { Button } from "@ui/공통/Button";
import { KokConfirmSheet } from "@ui/공통/KokConfirmSheet";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";
import { TabBarMain } from "@ui/공통/TabBar";
import { Toast } from "@ui/공통/Toast";
import {
  cookErrorMessage,
  getCooks,
  sendCook,
  type CookListResponse,
} from "@ui/받은콕/cookApi";
import {
  getMyProfile,
  getProfiles,
  isActiveNow,
  profileErrorMessage,
  type ProfileResponse,
} from "@ui/프로필작성/profileApi";
import {
  countFilters,
  EMPTY_FILTERS,
  FilterSheet,
  type ExploreFilters,
} from "./FilterSheet";

/**
 * 참가자를 둘러보고 콕을 보내는 화면.
 *
 * 이미 콕한 사람은 버튼을 잠근다 — 기능명세 3절이 같은 상대에게 중복 발송을
 * 막고 있어서, 누를 수 있게 두면 눌러보고 나서야 실패를 알게 된다.
 */
export function ExploreScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<ProfileResponse[]>([]);
  const [myProfile, setMyProfile] = useState<ProfileResponse | null>(null);
  const [sentUserIds, setSentUserIds] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<ExploreFilters>(EMPTY_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [kokTarget, setKokTarget] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSendingKok, setIsSendingKok] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [kokRemaining, setKokRemaining] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const applyCookState = useCallback((cooks: CookListResponse) => {
    setKokRemaining(Math.max(cooks.usage.dailyLimit - cooks.usage.todayUsed, 0));
    setSentUserIds(new Set(cooks.sent.map((cook) => cook.userId)));
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profiles, mine, cooks] = await Promise.all([
          getProfiles(),
          getMyProfile(),
          getCooks(),
        ]);
        if (!active) return;
        setMembers(profiles);
        setMyProfile(mine);
        applyCookState(cooks);
      } catch (loadError) {
        if (active) setError(profileErrorMessage(loadError));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [applyCookState]);

  const options = buildOptions(members);
  const filtered = shuffleForSession(members).filter((member) =>
    matches(member, filters),
  );
  const visibleMembers = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleMembers.length;
  const activeCount = members.filter(isActiveNow).length;
  const knowsActivity = members.some((member) => member.lastActiveAt);

  const handleKokConfirm = async () => {
    if (!kokTarget) return;
    setIsSendingKok(true);
    try {
      const result = await sendCook(kokTarget.userId);
      setKokTarget(null);
      if (result.matched && result.matchId !== null) {
        router.push(`/match/${result.matchId}/matched`);
        return;
      }
      setToastMessage("콕을 보냈어요. 상대의 콕을 기다려주세요.");
      applyCookState(await getCooks());
    } catch (sendError) {
      setToastMessage(cookErrorMessage(sendError));
    } finally {
      setIsSendingKok(false);
    }
  };

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-1 bg-(--color-surface) px-2 pr-4">
        <Link
          href="/main"
          aria-label="홈으로"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-surface-alt) text-(--color-text-strong)"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-lg font-bold text-(--color-text-strong)">탐색</h1>
        <span className="text-xs font-semibold text-(--color-accent)">
          콕 {kokRemaining}개 남음
        </span>
      </header>

      <TabBarMain className="gap-3 px-4 pb-4">
        <div className="flex shrink-0 items-center justify-between">
          {/*
            "현재 활동 중"은 lastActiveAt이 있어야 셀 수 있는데 아직 서버가
            내려주지 않는다. 없는 동안 0명이라고 쓰면 거짓말이라, 셀 수 있게
            되기 전까지는 전체 인원을 보여준다.
          */}
          <p className="text-sm text-(--color-text-sub)">
            {knowsActivity ? "현재 활동 중 " : "참가자 "}
            <span className="font-bold text-(--color-accent)">
              {knowsActivity ? activeCount : members.length}명
            </span>
          </p>

          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-(--color-primary-lighter) px-4 py-2 text-sm font-bold text-(--color-text-body)"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            필터
            {countFilters(filters) > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-accent) px-1 text-[11px] text-(--color-text-on-primary)">
                {countFilters(filters)}
              </span>
            ) : null}
          </button>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-(--color-text-sub)">
            참가자를 불러오는 중...
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="py-10 text-center text-sm text-(--color-danger)">
            {error}
          </p>
        ) : null}

        {!isLoading && !error && visibleMembers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <span className="text-4xl" aria-hidden="true">
              🔍
            </span>
            <p className="text-sm text-(--color-text-sub)">조건에 맞는 참가자가 없어요</p>
            {countFilters(filters) > 0 ? (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                필터 지우기
              </Button>
            ) : null}
          </div>
        ) : null}

        <ul className="flex flex-col gap-3">
          {visibleMembers.map((member) => (
            <li key={member.userId}>
              <MemberCard
                member={member}
                commonCount={myProfile ? commonHobbies(member, myProfile) : 0}
                alreadySent={sentUserIds.has(member.userId)}
                onKok={() => setKokTarget(member)}
              />
            </li>
          ))}
        </ul>

        {hasMore ? (
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-full border border-(--color-border) py-3 text-sm font-bold text-(--color-text-body)"
          >
            {filtered.length - visibleMembers.length}명 더 보기
          </button>
        ) : null}
      </TabBarMain>

      <BottomSheet open={isFilterOpen} onClose={() => setIsFilterOpen(false)}>
        <FilterSheet
          filters={filters}
          options={options}
          onApply={(next) => {
            setFilters(next);
            setVisibleCount(PAGE_SIZE);
            setIsFilterOpen(false);
          }}
          onClose={() => setIsFilterOpen(false)}
        />
      </BottomSheet>

      <BottomSheet open={kokTarget !== null} onClose={() => setKokTarget(null)}>
        {kokTarget ? (
          <KokConfirmSheet
            name={kokTarget.nickname}
            userId={kokTarget.userId}
            onCancel={() => setKokTarget(null)}
            onConfirm={() => void handleKokConfirm()}
            isSubmitting={isSendingKok}
          />
        ) : null}
      </BottomSheet>

      <Toast
        open={toastMessage !== null}
        message={toastMessage ?? ""}
        onDismiss={() => setToastMessage(null)}
      />
    </PhoneFrame>
  );
}

function MemberCard({
  member,
  commonCount,
  alreadySent,
  onKok,
}: {
  member: ProfileResponse;
  commonCount: number;
  alreadySent: boolean;
  onKok: () => void;
}) {
  return (
    <div className="relative flex items-center gap-3 rounded-[1.25rem] bg-(--color-surface) p-4 shadow-(--shadow-card)">
      <Link
        href={`/profile/${member.userId}`}
        className="absolute inset-0 z-0 rounded-[1.25rem]"
        aria-label={`${member.nickname} 프로필 보기`}
      />

      <div className="pointer-events-none relative z-10 flex flex-1 items-center gap-3 overflow-hidden">
        <Avatar name={member.nickname} size="lg" userId={member.userId} />

        <div className="flex flex-1 flex-col items-start gap-1 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-bold text-(--color-text-strong)">
              {member.nickname}
            </span>
            <Tag variant="accent">{member.mbti}</Tag>
          </div>
          <span className="truncate text-[13px] text-(--color-text-sub)">
            {[`${member.age}세`, member.department].filter(Boolean).join(" · ")}
          </span>
          {commonCount > 0 ? (
            <span className="rounded-full bg-(--color-primary-lighter) px-2.5 py-1 text-xs font-medium text-(--color-primary)">
              공통 {commonCount}개 ✨
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative z-10">
        {alreadySent ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-(--color-primary-lighter) px-4 py-2.5 text-sm font-bold text-(--color-text-muted)">
            콕
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">이미 보냈어요</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={onKok}
            className="shrink-0 rounded-full bg-(--color-accent) px-4 py-2.5 text-sm font-bold text-(--color-text-on-primary) active:opacity-90"
          >
            콕!
          </button>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;
const SEED_KEY = "facecook:explore:seed";

/**
 * 사람마다 다른 순서로 보여준다.
 *
 * 서버가 준 순서를 그대로 쓰면 앞줄에 있는 사람만 콕을 받는다. 콕이 하루
 * 몇 개뿐이라 목록 아래쪽까지 내려가는 사람이 거의 없기 때문이다.
 *
 * 다만 매번 새로 섞으면 아까 본 사람을 다시 못 찾는다. 그래서 앱을 열 때
 * 뽑은 씨앗을 세션에 저장해 두고, 그 세션 동안에는 순서가 고정되게 한다.
 */
function shuffleForSession(members: ProfileResponse[]) {
  const seed = sessionSeed();
  return [...members].sort((a, b) => mix(a.userId, seed) - mix(b.userId, seed));
}

function sessionSeed() {
  try {
    const saved = sessionStorage.getItem(SEED_KEY);
    if (saved) return Number(saved);
    const seed = Math.floor(Math.random() * 2 ** 31);
    sessionStorage.setItem(SEED_KEY, String(seed));
    return seed;
  } catch {
    // 저장이 막히면 순서가 매번 달라진다. 목록이 보이는 게 우선이다.
    return 1;
  }
}

/** userId를 씨앗과 섞어 고르게 흩어진 수를 만든다. 같은 입력이면 같은 값이다. */
function mix(userId: number, seed: number) {
  let h = (userId ^ seed) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** 참가자 목록에 실제로 있는 값만 선택지로 만든다. 아무도 없는 조건은 고를 수 없다. */
function buildOptions(members: ProfileResponse[]): ExploreFilters {
  const departments = new Set<string>();
  const mbtis = new Set<string>();
  const hobbies = new Set<string>();

  for (const member of members) {
    if (member.department) departments.add(member.department);
    if (member.mbti) mbtis.add(member.mbti);
    for (const hobby of splitHobby(member)) hobbies.add(hobby);
  }

  return {
    departments: [...departments].sort(),
    mbtis: [...mbtis].sort(),
    hobbies: [...hobbies].sort(),
  };
}

/** 한 갈래 안에서는 하나만 맞으면 되고, 갈래끼리는 모두 맞아야 한다. */
function matches(member: ProfileResponse, filters: ExploreFilters) {
  if (
    filters.departments.length > 0 &&
    !(member.department && filters.departments.includes(member.department))
  ) {
    return false;
  }
  if (filters.mbtis.length > 0 && !filters.mbtis.includes(member.mbti)) {
    return false;
  }
  if (filters.hobbies.length > 0) {
    const own = splitHobby(member);
    if (!filters.hobbies.some((hobby) => own.includes(hobby))) return false;
  }
  return true;
}

function splitHobby(profile: ProfileResponse) {
  return profile.hobby
    .split(",")
    .map((hobby) => hobby.trim())
    .filter(Boolean);
}

function commonHobbies(profile: ProfileResponse, mine: ProfileResponse) {
  const mineSet = new Set(splitHobby(mine));
  return splitHobby(profile).filter((hobby) => mineSet.has(hobby)).length;
}
