"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { Button } from "@ui/공통/Button";
import { KokConfirmSheet } from "@ui/공통/KokConfirmSheet";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";
import { TabBar } from "@ui/공통/TabBar";
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

const AVATAR_COLORS = ["#4F46E5", "#22C55E", "#5B5FE9", "#F59E0B", "#EF4444"];

export function MainScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [members, setMembers] = useState<ProfileResponse[]>([]);
  const [myProfile, setMyProfile] = useState<ProfileResponse | null>(null);
  const [kokTarget, setKokTarget] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProfiles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profiles, mine] = await Promise.all([
          getProfiles(),
          getMyProfile(),
        ]);
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

  const visibleMembers = members.filter((member) => {
    if (!myProfile || activeFilter === "all") return true;
    if (activeFilter === "department") {
      return Boolean(
        myProfile.department && member.department === myProfile.department,
      );
    }
    if (activeFilter === "mbti") return member.mbti === myProfile.mbti;
    return commonHobbies(member, myProfile) > 0;
  });

  const handleKokConfirm = () => {
    setKokTarget(null);
  };

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-(--color-border) bg-(--color-surface) px-4">
        <h1 className="text-lg font-bold text-(--color-text-strong)">STAR 콕</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="알림"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-(--color-border) text-(--color-text-sub)"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <div className="flex flex-col gap-5 p-4">
          <p className="text-sm font-medium text-(--color-text-strong)">
            참가자 · <span className="text-(--color-primary)">{members.length}명</span>
          </p>

          <div className="flex gap-2 overflow-x-auto">
            {filters.map((filter) => {
              const isActive = filter.key === activeFilter;

              let chipClassName =
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors";
              if (isActive) {
                chipClassName += " bg-(--color-primary) text-(--color-text-on-primary)";
              } else {
                chipClassName += " border border-(--color-border) bg-(--color-surface) text-(--color-text-sub)";
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
              const commonCount = myProfile
                ? commonHobbies(member, myProfile)
                : 0;
              const subInfo = [`${member.age}세`, member.department]
                .filter(Boolean)
                .join(" · ");

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
                      bgColor={
                        AVATAR_COLORS[member.userId % AVATAR_COLORS.length]
                      }
                    />
                    <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-(--color-text-strong)">
                          {member.nickname}
                        </span>
                        <Tag variant="primary">{member.mbti}</Tag>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs text-(--color-text-sub)">
                          {subInfo}
                        </span>
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
        </div>
      </main>

      <TabBar />

      <BottomSheet open={kokTarget !== null} onClose={() => setKokTarget(null)}>
        {kokTarget ? (
          <KokConfirmSheet
            name={kokTarget.nickname}
            bgColor={AVATAR_COLORS[kokTarget.userId % AVATAR_COLORS.length]}
            onCancel={() => setKokTarget(null)}
            onConfirm={handleKokConfirm}
          />
        ) : null}
      </BottomSheet>
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
