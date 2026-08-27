"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, MousePointerClick, Settings } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { Button } from "@ui/공통/Button";
import { KokConfirmSheet } from "@ui/공통/KokConfirmSheet";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { StatCard } from "@ui/공통/StatCard";
import { Tag } from "@ui/공통/Tag";
import { TabBar } from "@ui/공통/TabBar";

interface Member {
  id: string;
  name: string;
  mbti: string;
  subInfo: string;
  commonCount: number;
  bgColor: string;
}

type FilterKey = "all" | "department" | "mbti" | "hobby";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "department", label: "같은 학과" },
  { key: "mbti", label: "같은 MBTI" },
  { key: "hobby", label: "취미 겹침" },
];

const activeMembers: { name: string; bgColor: string }[] = [
  { name: "지효", bgColor: "#4F46E5" },
  { name: "서연", bgColor: "#22C55E" },
  { name: "민준", bgColor: "#5B5FE9" },
  { name: "유진", bgColor: "#F59E0B" },
  { name: "도윤", bgColor: "#EF4444" },
];

const members: Member[] = [
  { id: "1", name: "지효", mbti: "ENFP", subInfo: "24세 · 컴퓨터공학과", commonCount: 3, bgColor: "#4F46E5" },
  { id: "2", name: "서연", mbti: "INFJ", subInfo: "22세 · 시각디자인과", commonCount: 2, bgColor: "#22C55E" },
  { id: "3", name: "민준", mbti: "ISTP", subInfo: "25세 · 기계공학과", commonCount: 1, bgColor: "#5B5FE9" },
];

export function MainScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [kokTarget, setKokTarget] = useState<Member | null>(null);

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
          <button
            type="button"
            aria-label="설정"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-(--color-border) text-(--color-text-sub)"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <div className="flex flex-col gap-5 p-4">
          <div className="relative overflow-hidden rounded-(--radius-lg) bg-(--color-primary-light) p-4">
            <p className="text-xs font-medium text-(--color-primary)">오늘의 콕</p>
            <p className="mt-1 text-xl font-bold text-(--color-text-strong)">콕 3회 남았어요</p>
            <p className="mt-1 text-sm text-(--color-text-sub)">마음이 가면, 상대방에게 보내보세요</p>
            <MousePointerClick
              className="absolute right-4 top-4 h-8 w-8 rotate-12 text-(--color-primary)"
              aria-hidden="true"
            />
          </div>

          <div className="flex gap-2">
            <StatCard label="보낸 콕" value="2개" />
            <StatCard label="승인 대기" value="1건" highlight />
            <StatCard label="매칭" value="1커플" />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-(--color-text-strong)">
              지금 활동 중 · <span className="text-(--color-primary)">48명</span>
            </p>
            <div className="flex gap-3 overflow-x-auto">
              {activeMembers.map((member) => (
                <div key={member.name} className="flex flex-col items-center gap-1">
                  <Avatar name={member.name} size="lg" bgColor={member.bgColor} online />
                  <span className="text-xs text-(--color-text-sub)">{member.name}</span>
                </div>
              ))}
            </div>
          </div>

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
            {members.map((member) => (
              <div
                key={member.id}
                className="relative flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3"
              >
                <Link
                  href={`/profile/${member.id}`}
                  className="absolute inset-0 z-0"
                  aria-label={`${member.name} 프로필 보기`}
                />
                <div className="pointer-events-none relative z-10 flex flex-1 items-center gap-3 overflow-hidden">
                  <Avatar name={member.name} size="lg" bgColor={member.bgColor} />
                  <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-(--color-text-strong)">
                        {member.name}
                      </span>
                      <Tag variant="primary">{member.mbti}</Tag>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs text-(--color-text-sub)">{member.subInfo}</span>
                      <Tag variant="default">공통 {member.commonCount}개</Tag>
                    </div>
                  </div>
                </div>
                <div className="relative z-10">
                  <Button size="sm" onClick={() => setKokTarget(member)}>
                    콕
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <TabBar />

      <BottomSheet open={kokTarget !== null} onClose={() => setKokTarget(null)}>
        {kokTarget ? (
          <KokConfirmSheet
            name={kokTarget.name}
            bgColor={kokTarget.bgColor}
            onCancel={() => setKokTarget(null)}
            onConfirm={() => setKokTarget(null)}
          />
        ) : null}
      </BottomSheet>
    </PhoneFrame>
  );
}
