"use client";

import { useState } from "react";
import { ChevronRight, Lock, Shield, Sparkles } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { StatCard } from "@ui/공통/StatCard";
import { Tag } from "@ui/공통/Tag";
import { TabBar } from "@ui/공통/TabBar";

export function MyPageScreen() {
  const [bio, setBio] = useState("주말엔 주로 암장 가거나 필름카메라 들고 산책해요.");
  const [department, setDepartment] = useState("컴퓨터공학과");
  const [grade, setGrade] = useState("3학년");
  const [idealType, setIdealType] = useState("유머 있는 사람");

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-2 border-b border-(--color-border) bg-(--color-surface) px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--color-primary) text-(--color-text-on-primary)">
          <Sparkles className="h-4 w-4" />
        </span>
        <h1 className="text-lg font-bold text-(--color-text-strong)">마이</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <div className="flex flex-col gap-5 p-4">
          <div className="flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
            <Avatar name="나" size="xl" online />
            <div className="flex flex-1 flex-col gap-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-(--color-text-strong)">지호</span>
                <Tag variant="primary">ENFP</Tag>
              </div>
              <span className="truncate text-xs text-(--color-text-sub)">24세 · O형 · 컴퓨터공학과 3학년</span>
            </div>
            <Button size="sm" variant="outline">
              수정
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-(--radius-lg) bg-(--color-primary-lighter) px-4 py-3">
            <span className="text-sm font-medium text-(--color-text-strong)">오늘 남은 콕</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-(--color-primary)" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-(--color-primary)" aria-hidden="true" />
              <span
                className="h-2 w-2 rounded-full border border-(--color-border-strong)"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <StatCard label="보낸 콕" value="2" />
            <StatCard label="받은 콕" value="2" />
            <StatCard label="매칭" value="1" />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-(--color-text-strong)">프로필 수정</p>
              <p className="text-xs text-(--color-text-sub)">선택 항목만 바꿀 수 있어요</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bio" className="text-xs font-medium text-(--color-text-sub)">
                자기소개
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={2}
                className="resize-none rounded-(--radius-lg) bg-(--color-surface-alt) px-3 py-2.5 text-sm text-(--color-text-strong) outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-(--color-text-sub)">학과 · 학년 · 이상형</label>
              <div className="flex gap-2">
                <input
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  className="h-11 flex-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text-strong) outline-none"
                />
                <input
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  className="h-11 w-24 shrink-0 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text-strong) outline-none"
                />
              </div>
              <input
                value={idealType}
                onChange={(event) => setIdealType(event.target.value)}
                className="h-11 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text-strong) outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-(--color-text-strong)">필수 항목</p>
              <Lock className="h-3 w-3 text-(--color-text-muted)" aria-hidden="true" />
              <p className="text-xs text-(--color-text-muted)">수정 불가</p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="flex items-center justify-between rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-4 py-3 text-left"
              >
                <span className="text-sm text-(--color-text-strong)">알림 설정</span>
                <ChevronRight className="h-4 w-4 text-(--color-text-muted)" />
              </button>
              <button
                type="button"
                className="flex items-center justify-between rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-4 py-3 text-left"
              >
                <span className="flex items-center gap-1.5 text-sm text-(--color-text-strong)">
                  <Shield className="h-3.5 w-3.5 text-(--color-text-muted)" />
                  약관 · 개인정보 처리방침
                </span>
                <ChevronRight className="h-4 w-4 text-(--color-text-muted)" />
              </button>
            </div>

            <button type="button" className="py-1 text-left text-sm text-(--color-text-sub)">
              로그아웃
            </button>
          </div>
        </div>
      </main>

      <TabBar />
    </PhoneFrame>
  );
}
