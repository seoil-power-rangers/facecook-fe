"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { Button } from "@ui/공통/Button";
import { KokConfirmSheet } from "@ui/공통/KokConfirmSheet";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";
import { TabBarMain } from "@ui/공통/TabBar";
import { Toast } from "@ui/공통/Toast";
import { cookErrorMessage, getCooks, sendCook } from "@ui/받은콕/cookApi";
import {
  getMyProfile,
  getProfiles,
  profileErrorMessage,
  type ProfileResponse,
} from "@ui/프로필작성/profileApi";

type FilterKey = "all" | "department" | "mbti" | "hobby";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "department", label: "같은 학과" },
  { key: "mbti", label: "같은 MBTI" },
  { key: "hobby", label: "취미 겹침" },
];

/**
 * 참가자를 둘러보고 콕을 보내는 화면.
 *
 * 원래 홈(/main)이 하던 일인데, 홈이 마스코트 허브가 되면서 목록만 이리로
 * 옮겼다. 홈의 [탐색하기]가 여기로 온다.
 */
export function ExploreScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [members, setMembers] = useState<ProfileResponse[]>([]);
  const [myProfile, setMyProfile] = useState<ProfileResponse | null>(null);
  const [kokTarget, setKokTarget] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSendingKok, setIsSendingKok] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [kokRemaining, setKokRemaining] = useState(0);

  useEffect(() => {
    let active = true;

    const loadProfiles = async () => {
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

    void loadProfiles();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getCooks()
      .then((cooks) => {
        if (!active) return;
        setKokRemaining(Math.max(cooks.usage.dailyLimit - cooks.usage.todayUsed, 0));
      })
      .catch(() => {
        // 남은 횟수는 부가 정보라 조회 실패해도 목록까지 막지 않는다.
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleMembers = members.filter((member) => {
    if (!myProfile || activeFilter === "all") return true;
    if (activeFilter === "department") {
      return Boolean(myProfile.department && member.department === myProfile.department);
    }
    if (activeFilter === "mbti") return member.mbti === myProfile.mbti;
    return commonHobbies(member, myProfile) > 0;
  });

  const handleKokConfirm = async () => {
    if (!kokTarget) return;
    setIsSendingKok(true);
    try {
      const result = await sendCook(kokTarget.userId);
      setKokTarget(null);
      setKokRemaining((remaining) => Math.max(remaining - 1, 0));
      if (result.matched && result.matchId !== null) {
        router.push(`/match/${result.matchId}/matched`);
        return;
      }
      setToastMessage("콕을 보냈어요. 상대의 콕을 기다려주세요.");
    } catch (sendError) {
      setToastMessage(cookErrorMessage(sendError));
    } finally {
      setIsSendingKok(false);
    }
  };

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-1 border-b border-(--color-border) bg-(--color-surface) px-2 pr-4">
        <Link
          href="/main"
          aria-label="홈으로"
          className="flex h-9 w-9 items-center justify-center rounded-full text-(--color-text-strong)"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 text-lg font-bold text-(--color-text-strong)">탐색하기</h1>
        <span className="text-xs font-semibold text-(--color-primary)">
          콕 {kokRemaining}개 남음
        </span>
      </header>

      <TabBarMain className="gap-4 p-4">
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((filter) => {
            const isActive = filter.key === activeFilter;

            let chipClassName =
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors";
            if (isActive) {
              chipClassName += " bg-(--color-primary) text-(--color-text-on-primary)";
            } else {
              chipClassName +=
                " border border-(--color-border) bg-(--color-surface) text-(--color-text-sub)";
            }

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={chipClassName}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <p className="text-sm font-medium text-(--color-text-strong)">
          참가자 · <span className="text-(--color-primary)">{members.length}명</span>
        </p>

        <div className="flex flex-col gap-2">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-(--color-text-sub)">
              참가자 프로필을 불러오는 중...
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="py-8 text-center text-sm text-(--color-danger)">
              {error}
            </p>
          ) : null}
          {!isLoading && !error && visibleMembers.length === 0 ? (
            <p className="py-8 text-center text-sm text-(--color-text-sub)">
              조건에 맞는 참가자가 없어요.
            </p>
          ) : null}
          {visibleMembers.map((member) => {
            const commonCount = myProfile ? commonHobbies(member, myProfile) : 0;
            const subInfo = [`${member.age}세`, member.department].filter(Boolean).join(" · ");

            return (
              <div
                key={member.userId}
                className="relative flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3"
              >
                <Link
                  href={`/profile/${member.userId}`}
                  className="absolute inset-0 z-0"
                  aria-label={`${member.nickname} 프로필 보기`}
                />
                <div className="pointer-events-none relative z-10 flex flex-1 items-center gap-3 overflow-hidden">
                  <Avatar
                    name={member.nickname}
                    size="lg"
                    userId={member.userId}
                  />
                  <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-(--color-text-strong)">
                        {member.nickname}
                      </span>
                      <Tag variant="primary">{member.mbti}</Tag>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs text-(--color-text-sub)">{subInfo}</span>
                      <Tag variant="default">공통 {commonCount}개</Tag>
                    </div>
                  </div>
                </div>
                <div className="relative z-10">
                  <Button size="sm" onClick={() => setKokTarget(member)}>
                    콕
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </TabBarMain>

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

function commonHobbies(profile: ProfileResponse, mine: ProfileResponse) {
  const mineSet = new Set(
    mine.hobby.split(",").map((hobby) => hobby.trim()).filter(Boolean),
  );
  return profile.hobby
    .split(",")
    .map((hobby) => hobby.trim())
    .filter((hobby) => hobby && mineSet.has(hobby)).length;
}
