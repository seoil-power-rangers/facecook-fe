"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { GENDERS, MBTI_AXES } from "@ui/공통/constants";
import {
  cookErrorCode,
  cookErrorMessage,
  getCooks,
  sendCook,
  type CookListResponse,
} from "@ui/받은콕/cookApi";
import {
  getDepartments,
  getMyProfile,
  getProfiles,
  isActiveNow,
  profileErrorMessage,
  type DepartmentGroup,
  type ProfileResponse,
} from "@ui/프로필작성/profileApi";
import {
  countFilters,
  EMPTY_FILTERS,
  FilterSheet,
  type ExploreFilters,
  type ExploreOptions,
} from "./FilterSheet";
import { track } from "@ui/공통/analytics";

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
  const [kokRemaining, setKokRemaining] = useState<number | null>(null);
  const [kokLimit, setKokLimit] = useState<number | null>(null);
  const [departmentGroups, setDepartmentGroups] = useState<DepartmentGroup[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const applyCookState = useCallback((cooks: CookListResponse) => {
    setKokRemaining(Math.max(cooks.usage.dailyLimit - cooks.usage.todayUsed, 0));
    setKokLimit(cooks.usage.dailyLimit);
    setSentUserIds(new Set(cooks.sent.map((cook) => cook.userId)));
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profiles, mine] = await Promise.all([getProfiles(), getMyProfile()]);
        if (!active) return;
        setMembers(profiles);
        setMyProfile(mine);
      } catch (loadError) {
        if (active) setError(profileErrorMessage(loadError));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    // 학부 묶음은 필터 시트에서만 쓴다. 실패해도 목록은 그대로 보여준다 —
    // 시트가 묶지 않고 한 덩어리로 떨어뜨린다.
    getDepartments()
      .then((groups) => {
        if (active) setDepartmentGroups(groups);
      })
      .catch(() => undefined);

    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // 콕 잔여횟수·이미 보낸 목록은 부가 정보라, 조회에 실패해도 참가자
    // 목록까지 에러로 막지 않는다(MyPageScreen의 활동 통계와 같은 원칙).
    let active = true;
    getCooks()
      .then((cooks) => {
        if (active) applyCookState(cooks);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [applyCookState]);

  const options = useMemo(() => buildOptions(members), [members]);
  const filtered = useMemo(
    () =>
      sortForSession(members, myProfile?.userId ?? 0).filter((member) =>
        matches(member, filters),
      ),
    [members, filters, myProfile?.userId],
  );
  const visibleMembers = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleMembers.length;
  const activeCount = useMemo(() => members.filter(isActiveNow).length, [members]);
  const knowsActivity = useMemo(
    () => members.some((member) => member.lastActiveAt),
    [members],
  );

  const handleKokConfirm = async () => {
    if (!kokTarget) return;
    const target = kokTarget;
    setIsSendingKok(true);
    try {
      const result = await sendCook(target.userId);
      track({ name: "cook_sent", props: { from: "explore" } });
      if (result.matched) track({ name: "match_created" });
      setKokTarget(null);
      if (result.matched && result.matchId !== null) {
        router.push(`/match/${result.matchId}/matched`);
        return;
      }
      // 재조회 없이 즉시 반영한다 — 재조회가 실패하면 성공 토스트가 실패
      // 메시지로 덮어써지고, 그 사이 같은 상대에게 중복 전송도 가능해진다.
      setSentUserIds((prev) => new Set(prev).add(target.userId));
      setKokRemaining((prev) => (prev === null ? null : Math.max(prev - 1, 0)));
      setToastMessage("콕을 보냈어요. 상대의 콕을 기다려주세요.");
    } catch (sendError) {
      track({
        name: "cook_failed",
        props: { code: cookErrorCode(sendError), from: "explore" },
      });
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
        {/* 아직 못 불러왔으면 "콕 개 남음"이 되므로 자리만 비워둔다. */}
        {kokRemaining === null ? null : (
          <span className="text-xs font-semibold text-(--color-accent)">
            콕 {kokRemaining}개 남음
          </span>
        )}
      </header>

      <TabBarMain className="gap-3 px-4 pb-4">
        <div className="flex shrink-0 items-center justify-between">
          {/*
            목록에는 전원이 나오므로 전체 인원을 먼저 쓴다. 활동 중 인원만
            적어두면 그만큼만 보이는 줄 알게 된다.

            활동 중은 lastActiveAt이 있어야 셀 수 있는데 서버가 아직 안 줄 수
            있다. 그동안 "활동 중 0명"이라고 쓰면 거짓말이라 아예 감춘다.
          */}
          <p className="text-sm text-(--color-text-sub)">
            참가자{" "}
            <span className="font-bold text-(--color-accent)">{members.length}명</span>
            {knowsActivity ? (
              <>
                {" · 활동 중 "}
                <span className="font-bold text-(--color-online)">{activeCount}명</span>
              </>
            ) : null}
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
          departmentGroups={departmentGroups}
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
            remaining={kokRemaining}
            dailyLimit={kokLimit}
            photoUrl={kokTarget.photo}
            gender={kokTarget.gender}
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
        <Avatar
          name={member.nickname}
          size="lg"
          userId={member.userId}
          photoUrl={member.photo}
          gender={member.gender}
        />

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
/**
 * 목록 순서. 활동 중인 사람을 앞으로 올리고, 그 안에서는 섞는다.
 *
 * 전원을 다 보여주되(기능명세 3절: 본인 제외 전체), 지금 접속해 있는 사람이
 * 뒤에 묻히면 콕을 보내도 답이 안 온다. 부스에서 그 자리에 있는 사람끼리
 * 이어지는 게 이 서비스의 목적이라 활동 여부를 첫 기준으로 둔다.
 *
 * 같은 무리 안에서 섞는 이유는 그대로다 — 순서를 고정하면 앞줄만 콕을 받는다.
 */
function sortForSession(members: ProfileResponse[], fallbackSeed: number) {
  const seed = sessionSeed(fallbackSeed);

  return [...members].sort((a, b) => {
    const activeGap = Number(isActiveNow(b)) - Number(isActiveNow(a));
    if (activeGap !== 0) return activeGap;
    return mix(a.userId, seed) - mix(b.userId, seed);
  });
}

function sessionSeed(fallbackSeed: number) {
  try {
    const saved = sessionStorage.getItem(SEED_KEY);
    if (saved) return Number(saved);
    const seed = Math.floor(Math.random() * 2 ** 31);
    sessionStorage.setItem(SEED_KEY, String(seed));
    return seed;
  } catch {
    // 저장이 막히면(시크릿 모드, iOS 저장공간 정리 등) 세션 내내 순서를
    // 고정할 수는 없다. 다만 모두에게 똑같은 값을 쓰면 그 사람들 사이에서
    // 다시 "앞줄만 콕을 받는" 쏠림이 재발하므로, 최소한 사람마다는 다른
    // 값이 되도록 보는 사람 자신의 userId를 대신 쓴다.
    return fallbackSeed;
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
function buildOptions(members: ProfileResponse[]): ExploreOptions {
  const departments = new Set<string>();
  const mbtis = new Set<string>();
  const hobbies = new Set<string>();
  const genders = new Set<string>();

  for (const member of members) {
    if (member.department) departments.add(member.department);
    if (member.mbti) mbtis.add(member.mbti);
    if (member.gender) genders.add(member.gender);
    for (const hobby of splitHobby(member)) hobbies.add(hobby);
  }

  return {
    departments: [...departments].sort(),
    mbtis: [...mbtis].sort(),
    hobbies: [...hobbies].sort(),
    // GENDERS와 같은 순서(여성·남성)로 고정한다. Set 순서는 데이터에 따라 뒤집힌다.
    genders: GENDERS.filter((gender) => genders.has(gender)),
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
  /*
   * MBTI는 글자 단위로 고른다. 시트가 한 축에 하나만 고르게 막지만, 여기서는
   * 축 안에서 여러 개가 와도 하나만 맞으면 통과하게 둔다 — 예전 조건이 남아
   * 들어와도 결과가 0명으로 꺼지지 않는다. 축끼리는 모두 맞아야 한다.
   */
  if (filters.mbtiLetters.length > 0) {
    const fits = MBTI_AXES.every((axis, index) => {
      const wanted = filters.mbtiLetters.filter(
        (letter) => letter === axis.top.code || letter === axis.bottom.code,
      );
      return wanted.length === 0 || wanted.includes(member.mbti?.[index] ?? "");
    });
    if (!fits) return false;
  }
  if (filters.hobbies.length > 0) {
    const own = splitHobby(member);
    if (!filters.hobbies.some((hobby) => own.includes(hobby))) return false;
  }
  if (filters.genders.length > 0 && !filters.genders.includes(member.gender)) {
    return false;
  }
  if (member.age < filters.minAge) return false;
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
