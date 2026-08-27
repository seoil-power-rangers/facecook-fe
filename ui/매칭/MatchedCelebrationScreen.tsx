import Link from "next/link";
import { Infinity as InfinityIcon, Send, Ticket } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";
import type { MatchRoom } from "./matches.mock";

export function MatchedCelebrationScreen({ room }: { room: MatchRoom }) {
  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex shrink-0 flex-col items-center gap-4 bg-(--color-hero-bg) px-6 pb-12 pt-10 text-center text-(--color-hero-text)">
          <p className="text-xs font-semibold tracking-[0.2em] text-(--color-hero-text-sub)">MATCHED</p>

          <div className="relative flex items-center justify-center py-2">
            <div className="z-0 -mr-6 flex h-24 w-24 items-center justify-center rounded-full bg-(--color-primary-light) text-2xl font-bold text-(--color-primary) ring-4 ring-(--color-hero-bg)">
              나
            </div>
            <div
              className="z-0 -ml-6 flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-(--color-text-on-primary) ring-4 ring-(--color-hero-bg)"
              style={{ backgroundColor: room.bgColor }}
            >
              {room.name.charAt(0)}
            </div>
            <div className="absolute z-10 flex h-9 w-9 items-center justify-center rounded-full bg-(--color-surface) text-(--color-primary) shadow-(--shadow-card)">
              <InfinityIcon className="h-4 w-4" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xl font-bold">매칭됐어요</p>
            <p className="text-sm text-(--color-hero-text-sub)">{room.name}님과 서로 콕했어요</p>
          </div>
        </div>

        <div className="-mt-4 flex flex-1 flex-col gap-5 rounded-t-[1.75rem] bg-(--color-surface) p-5">
          <div className="flex flex-col gap-2 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 shadow-(--shadow-card)">
            <div className="flex items-center justify-between">
              <Tag variant="primary">STEP 1</Tag>
              <Ticket className="h-4 w-4 text-(--color-text-sub)" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-(--color-text-strong)">둘이 함께 인증사진 찍기</p>
            <p className="text-xs text-(--color-text-sub)">
              총학생회 부스에서 인증받으면 선물을 받고 다음 미션이 열려요.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-(--color-text-strong)">둘 다 좋아해요</p>
            <div className="flex flex-wrap gap-2">
              {room.sharedInterests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-(--color-border) px-3 py-1.5 text-xs text-(--color-text-sub)"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex flex-col items-center gap-2">
            <Link href={`/match/${room.id}`} className="w-full">
              <Button fullWidth className="gap-2">
                <Send className="h-4 w-4" />
                채팅 시작하기
              </Button>
            </Link>
            <p className="text-xs text-(--color-text-muted)">채팅방은 서비스 종료까지 유지돼요</p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
