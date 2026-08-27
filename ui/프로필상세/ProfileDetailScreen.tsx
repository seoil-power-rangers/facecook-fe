"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Footprints, MousePointerClick, Send, Siren, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { Button } from "@ui/공통/Button";
import { KokConfirmSheet } from "@ui/공통/KokConfirmSheet";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";

const infoRows: { label: string; value: string }[] = [
  { label: "MBTI", value: "ENFP" },
  { label: "혈액형", value: "O형" },
  { label: "성별", value: "남성" },
  { label: "나이", value: "24세" },
];

const hobbies: { label: string; icon: LucideIcon }[] = [
  { label: "맛집탐방", icon: Utensils },
  { label: "산책", icon: Footprints },
  { label: "여행", icon: Send },
];

export function ProfileDetailScreen({ userId }: { userId: string }) {
  const router = useRouter();
  const [kokSheetOpen, setKokSheetOpen] = useState(false);

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto">
        <div className="bg-(--color-hero-bg) px-4 pb-10 pt-3 text-(--color-hero-text)">
          <div className="flex items-center justify-between">
            <button type="button" aria-label="뒤로가기" className="p-1" onClick={() => router.back()}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <Link href={`/profile/${userId}/report`} aria-label="신고" className="p-1">
              <Siren className="h-4 w-4" />
            </Link>
          </div>

          <h1 className="mt-4 text-lg font-bold">주말엔 암장에서 살아요</h1>
          <p className="mt-1 text-sm text-(--color-hero-text-sub)">지호 · 24세 · 컴퓨터공학과 3학년</p>

          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-(--color-online)" aria-hidden="true" />
            활동 중
          </span>
        </div>

        <div className="-mt-12 flex flex-col items-center gap-2">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-(--color-primary-lighter) text-3xl font-bold text-(--color-primary) ring-4 ring-(--color-surface)">
            지
          </div>
          <Tag variant="primary">공통 관심사 3개</Tag>
        </div>

        <div className="flex flex-col gap-6 px-4 pb-6 pt-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold text-(--color-text-strong)">기본 정보</h2>
            <div className="divide-y divide-(--color-border) rounded-(--radius-lg) border border-(--color-border)">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-(--color-text-sub)">{row.label}</span>
                  <span className="text-sm font-semibold text-(--color-text-strong)">{row.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-(--color-text-strong)">자기소개</h2>
            <p className="rounded-(--radius-lg) bg-(--color-surface-alt) p-4 text-sm leading-relaxed text-(--color-text-body)">
              주말엔 주로 암장 가거나 필름카메라 들고 산책해요. 조용한 카페 좋아합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-(--color-text-strong)">이런 걸 하고 싶어요</h2>
            <div className="flex justify-around">
              {hobbies.map((hobby) => (
                <div key={hobby.label} className="flex flex-col items-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-primary-lighter) text-(--color-primary)">
                    <hobby.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-(--color-text-sub)">{hobby.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-(--color-border) bg-(--color-surface) p-4">
        <Button fullWidth className="gap-2" onClick={() => setKokSheetOpen(true)}>
          <MousePointerClick className="h-4 w-4" />
          콕 보내기
        </Button>
      </div>

      <BottomSheet open={kokSheetOpen} onClose={() => setKokSheetOpen(false)}>
        <KokConfirmSheet
          name="지호"
          onCancel={() => setKokSheetOpen(false)}
          onConfirm={() => setKokSheetOpen(false)}
        />
      </BottomSheet>
    </PhoneFrame>
  );
}
