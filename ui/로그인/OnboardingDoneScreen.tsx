"use client";

import { useRouter } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { Tag } from "@ui/공통/Tag";
import { EVENT, MBTI_NICKNAMES } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

/**
 * 07 온보딩 완료 — 방금 만든 프로필을 한 번 보여주고 본 서비스로 넘긴다.
 * 진행바·뒤로가기는 없다. 여기서 draft를 비운다.
 */
export function OnboardingDoneScreen() {
  const router = useRouter();
  const { draft, reset } = useOnboarding();

  const mbti = draft.mbti.join("");
  const nickname = draft.nickname || "새내기";

  const start = () => {
    // 서버가 붙으면 여기 오기 전에 User + Profile 생성을 끝낸다.
    reset();
    router.push("/main");
  };

  return (
    <div className="flex min-h-full flex-col px-5 pb-8 pt-4">
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-(--radius-full) bg-(--color-primary-light) text-(--color-primary)">
          <PartyPopper className="h-8 w-8" />
        </span>

        <h1 className="mt-6 text-center text-[24px] font-bold leading-snug text-(--color-text-strong)">
          프로필이 완성됐어요
        </h1>
        <p className="mt-2 text-center text-[14px] text-(--color-text-sub)">
          이제 마음이 가는 사람에게 콕 해보세요.
        </p>

        <div className="mt-8 w-full rounded-(--radius-lg) bg-(--color-surface) p-4 shadow-(--shadow-card)">
          <div className="flex items-center gap-3">
            <Avatar name={nickname} size="xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-bold text-(--color-text-strong)">
                {nickname}
              </p>
              <p className="mt-0.5 truncate text-[13px] text-(--color-text-sub)">
                {[draft.age && `${draft.age}세`, draft.department]
                  .filter(Boolean)
                  .join(" · ") || "프로필 정보 없음"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {mbti ? <Tag variant="primary">{mbti}</Tag> : null}
                {draft.bloodType ? <Tag>{draft.bloodType}</Tag> : null}
                {draft.grade ? <Tag>{draft.grade}</Tag> : null}
              </div>
            </div>
          </div>

          {mbti && MBTI_NICKNAMES[mbti] ? (
            <p className="mt-3 text-[13px] text-(--color-text-body)">
              {MBTI_NICKNAMES[mbti]}
            </p>
          ) : null}

          {draft.activities.length > 0 ? (
            <div className="mt-3 border-t border-(--color-border) pt-3">
              <p className="text-[11px] font-bold text-(--color-text-sub)">
                하고 싶은 활동
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {draft.activities.map((activity) => (
                  <Tag key={activity}>{activity}</Tag>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-5 w-full">
          <InfoBox>
            프로필·콕 기록은 매일 초기화돼요. 모든 데이터는 {EVENT.purgeAt}에
            삭제됩니다.
          </InfoBox>
        </div>
      </div>

      <div className="pt-8">
        <Button fullWidth onClick={start}>
          시작하기
        </Button>
      </div>
    </div>
  );
}
