'use client';

import { useEffect, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  CircleCheck,
  MousePointerClick,
  PartyPopper,
  Users,
} from 'lucide-react';
import { Avatar } from '@ui/공통/Avatar';
import { Button } from '@ui/공통/Button';
import { InfoBox } from '@ui/공통/InfoBox';
import { Tag } from '@ui/공통/Tag';
import { EVENT, MBTI_NICKNAMES } from '@ui/공통/constants';
import { useOnboarding } from '@ui/공통/onboarding';
import { useSession } from '@ui/공통/session';
import { getCooks } from '@ui/받은콕/cookApi';

const SLIDE_COUNT = 2;
const SWIPE_THRESHOLD_PX = 40;

/**
 * 07 온보딩 완료 — 두 장을 옆으로 스와이프해서 본다.
 * 1장: 방금 만든 프로필 미리보기. 2장: 콕 사용법 + 시작하기.
 * 진행바·뒤로가기는 없다. 2장에서 시작하면 draft를 비운다.
 */
export function OnboardingDoneScreen() {
  const router = useRouter();
  const { draft, reset } = useOnboarding();
  const { signIn } = useSession();
  const [slide, setSlide] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [kokDailyLimit, setKokDailyLimit] = useState<number | null>(null);

  const mbti = draft.mbti.join('');
  const nickname = draft.nickname || '새내기';

  useEffect(() => {
    let active = true;
    getCooks()
      .then((data) => {
        if (active) setKokDailyLimit(data.usage.dailyLimit);
      })
      .catch(() => {
        // 안내 문구는 부가 정보라 조회 실패 시 그냥 숨긴다.
      });
    return () => {
      active = false;
    };
  }, []);

  const goToSlide = (next: number) => {
    setSlide(Math.max(0, Math.min(SLIDE_COUNT - 1, next)));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    setDragStartX(event.clientX);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartX === null) return;
    const delta = event.clientX - dragStartX;
    if (delta < -SWIPE_THRESHOLD_PX) goToSlide(slide + 1);
    else if (delta > SWIPE_THRESHOLD_PX) goToSlide(slide - 1);
    setDragStartX(null);
  };

  const start = () => {
    // 서버가 붙으면 여기 오기 전에 User + Profile 생성을 끝낸다.
    signIn({ role: 'participant', name: nickname });
    reset();
    router.push('/main');
  };

  const handleCtaClick = () => {
    if (slide < SLIDE_COUNT - 1) goToSlide(slide + 1);
    else start();
  };

  return (
    <div className="flex min-h-full flex-col px-5 pb-8 pt-4">
      <div
        className="flex flex-1 flex-col overflow-hidden pt-20"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            width: `${SLIDE_COUNT * 100}%`,
            transform: `translateX(-${(slide * 100) / SLIDE_COUNT}%)`,
          }}
        >
          <div
            className="flex shrink-0 flex-col items-center text-center"
            style={{ width: `${100 / SLIDE_COUNT}%` }}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-(--radius-full) bg-(--color-primary-light) text-(--color-primary)">
              <PartyPopper className="h-8 w-8" />
            </span>

            <h1 className="mt-6 text-center text-[24px] font-bold leading-snug text-(--color-text-strong)">
              프로필이 완성됐어요
            </h1>
            <p className="mt-2 text-center text-[14px] text-(--color-text-sub)">
              이제 마음이 가는 사람에게 콕 해보세요.
            </p>

            <div className="mt-16 w-full rounded-(--radius-lg) bg-(--color-surface) p-4 shadow-(--shadow-card)">
              <div className="flex items-center gap-3">
                <Avatar
                  name={nickname}
                  size="xl"
                  photoUrl={draft.photoUrl || null}
                  gender={draft.gender}
                />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[17px] font-bold text-(--color-text-strong)">
                    {nickname}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-(--color-text-sub)">
                    {[draft.age && `${draft.age}세`, draft.department]
                      .filter(Boolean)
                      .join(' · ') || '프로필 정보 없음'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {mbti ? <Tag variant="primary">{mbti}</Tag> : null}
                    {draft.bloodType ? <Tag>{draft.bloodType}</Tag> : null}
                    {draft.grade ? <Tag>{draft.grade}</Tag> : null}
                  </div>
                </div>
              </div>

              {mbti && MBTI_NICKNAMES[mbti] ? (
                <p className="mt-3 text-left text-[13px] text-(--color-text-body)">
                  {MBTI_NICKNAMES[mbti]}
                </p>
              ) : null}

              {draft.activities.length > 0 ? (
                <div className="mt-3 border-t border-(--color-border) pt-3 text-left">
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

            <div className="mt-8 w-full">
              <InfoBox>
                프로필·콕 기록은 매일 초기화돼요. 모든 데이터는 {EVENT.purgeAt}
                에 삭제됩니다.
              </InfoBox>
            </div>
          </div>

          <div
            className="flex shrink-0 flex-col items-center text-center"
            style={{ width: `${100 / SLIDE_COUNT}%` }}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-(--radius-full) bg-(--color-primary-light) text-(--color-primary)">
              <MousePointerClick className="h-8 w-8" />
            </span>

            <h1 className="mt-6 text-center text-[24px] font-bold leading-snug text-(--color-text-strong)">
              이제 콕을 보내 봐요!
            </h1>

            <div className="mt-16 w-full rounded-(--radius-lg) bg-(--color-surface) p-4 shadow-(--shadow-card)">
              <p className="text-left text-[13px] font-bold text-(--color-text-sub)">
                콕은 이렇게 보내요
              </p>
              <ul className="mt-3 flex flex-col gap-3 text-left text-[14px] text-(--color-text-strong)">
                <li className="flex items-center gap-2.5">
                  <Users className="h-4.5 w-4.5 shrink-0 text-(--color-primary)" />
                  참가자 목록에서 마음에 드는 사람을 찾아요
                </li>
                <li className="flex items-center gap-2.5">
                  <MousePointerClick className="h-4.5 w-4.5 shrink-0 text-(--color-primary)" />
                  프로필에서 콕 버튼을 눌러요
                </li>
                <li className="flex items-center gap-2.5">
                  <CircleCheck className="h-4.5 w-4.5 shrink-0 text-(--color-primary)" />
                  상대도 콕하면 매칭 완료예요
                </li>
              </ul>
            </div>

            {kokDailyLimit !== null ? (
              <p className="mt-10 rounded-(--radius-full) bg-(--color-primary-light) px-4 py-2 text-[13px] font-semibold text-(--color-primary)">
                오늘 콕 {kokDailyLimit}번 사용 가능
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 pb-5">
        {Array.from({ length: SLIDE_COUNT }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`${index + 1}번째 화면 보기`}
            onClick={() => goToSlide(index)}
            className={`h-1.5 w-1.5 rounded-(--radius-full) ${
              index === slide
                ? 'bg-(--color-primary)'
                : 'bg-(--color-border-strong)'
            }`}
          />
        ))}
      </div>

      <Button fullWidth onClick={handleCtaClick}>
        {slide < SLIDE_COUNT - 1 ? '다음' : '완료하고 시작'}
      </Button>
    </div>
  );
}
