'use client';

import { useEffect, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, PartyPopper, Pointer } from 'lucide-react';
import { Avatar } from '@ui/공통/Avatar';
import { Button } from '@ui/공통/Button';
import { Tag } from '@ui/공통/Tag';
import { EVENT, MBTI_NICKNAMES } from '@ui/공통/constants';
import { useOnboarding } from '@ui/공통/onboarding';
import { useSession } from '@ui/공통/session';
import { getCooks } from '@ui/받은콕/cookApi';

const SLIDE_COUNT = 2;
const SWIPE_THRESHOLD_PX = 40;

/**
 * 07 온보딩 완료 — 두 장을 옆으로 스와이프해서 본다.
 * 1장: 방금 만든 프로필. 2장: 콕 사용법 + 시작하기.
 * 진행바·뒤로가기는 없다. 2장에서 시작하면 draft를 비운다.
 *
 * 1~5단계가 보라였던 것과 달리 여기만 따뜻한 흰 바탕에 산호를 쓴다 —
 * 입력이 끝나고 콕의 세계로 넘어왔다는 것을 색으로 표시한다.
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
    signIn({ role: 'participant', name: nickname });
    reset();
    router.push('/main');
  };

  const handleCtaClick = () => {
    if (slide < SLIDE_COUNT - 1) goToSlide(slide + 1);
    else start();
  };

  const dailyLimitNote =
    kokDailyLimit !== null
      ? `오늘 콕 ${kokDailyLimit}회 · 매일 자정 초기화`
      : `모든 데이터는 ${EVENT.purgeAt}에 삭제돼요`;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-(--color-chat-bg) px-5 pb-5 pt-7">
      <div
        className="flex flex-1 flex-col overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div
          className="flex flex-1 transition-transform duration-300 ease-out"
          style={{
            width: `${SLIDE_COUNT * 100}%`,
            transform: `translateX(-${(slide * 100) / SLIDE_COUNT}%)`,
          }}
        >
          <Slide
            icon={<PartyPopper className="h-6 w-6" />}
            title="프로필이 완성됐어요"
            subtitle="이제 마음이 가는 사람에게 콕 해보세요"
          >
            <ProfileCard
              nickname={nickname}
              photoUrl={draft.photoUrl}
              gender={draft.gender}
              summary={profileSummary(draft.age, draft.department, mbti)}
              mbtiNickname={mbti ? MBTI_NICKNAMES[mbti] : undefined}
              tags={[mbti, draft.bloodType, draft.grade].filter(Boolean)}
              activities={draft.activities}
            />
          </Slide>

          <Slide
            icon={<Pointer className="h-6 w-6" />}
            title="서로 콕하면 매칭이에요"
            subtitle="한쪽만 눌러서는 연결되지 않아요"
          >
            <KokExample />

            {/* 기울어진 카드 모서리가 아래 카드에 닿지 않게 넉넉히 띄운다. */}
            <div className="mt-9 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-4 py-5">
              <ol className="flex flex-col gap-4">
                {[
                  '참가자 목록에서 마음에 드는 사람을 찾아요',
                  '카드나 프로필에서 콕 버튼을 눌러요',
                  '상대도 누르면 매칭되고 채팅이 열려요',
                ].map((step, index) => (
                  <li key={step} className="flex gap-2.5 text-left">
                    <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-[10px] font-bold text-(--color-accent-pressed)">
                      {index + 1}
                    </span>
                    <span className="text-[13px] leading-relaxed text-(--color-text-strong)">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Slide>
        </div>
      </div>

      <p className="mt-7 text-center text-[11.5px] text-(--color-text-muted)">
        {dailyLimitNote}
      </p>

      <div className="flex justify-center gap-1.5 py-4">
        {Array.from({ length: SLIDE_COUNT }, (_, index) => {
          const current = index === slide;

          return (
            <button
              key={index}
              type="button"
              aria-label={`${index + 1}번째 화면 보기`}
              onClick={() => goToSlide(index)}
              // 현재 위치만 길쭉하게 둔다. 같은 크기의 점 두 개로는 옆으로
              // 넘길 수 있다는 것도, 지금 몇 번째인지도 잘 안 보인다.
              className={`h-1.5 rounded-(--radius-full) transition-all ${
                current
                  ? 'w-4 bg-(--color-accent)'
                  : 'w-1.5 bg-(--color-border-strong)'
              }`}
            />
          );
        })}
      </div>

      <Button variant="accent" fullWidth onClick={handleCtaClick}>
        {slide < SLIDE_COUNT - 1 ? '다음' : '콕 하러 가기'}
      </Button>
    </div>
  );
}

function profileSummary(age: string, department: string, mbti: string) {
  return [mbti, age && `${age}세`, department].filter(Boolean).join(' · ');
}

interface SlideProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/**
 * 두 장의 머리를 같은 모양으로 맞춘다 — 아이콘·제목·한 줄 설명까지가 고정이고
 * 그 아래만 바뀐다. 넘길 때 머리가 제자리에 있어야 같은 화면의 두 장으로 읽힌다.
 */
function Slide({ icon, title, subtitle, children }: SlideProps) {
  return (
    // 세로 가운데로 잡는다 — 내용 길이가 사진 유무·활동 개수에 따라 달라서
    // 위에 붙이면 짧은 쪽이 화면 아래를 통째로 비운다.
    <div
      className="flex shrink-0 flex-col items-center justify-center px-0.5 text-center"
      style={{ width: `${100 / SLIDE_COUNT}%` }}
    >
      <span className="flex h-13 w-13 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent-pressed)">
        {icon}
      </span>
      <h1 className="mt-4 text-[20px] font-bold text-(--color-text-strong)">
        {title}
      </h1>
      <p className="mt-2 text-[12.5px] text-(--color-text-sub)">{subtitle}</p>
      {/* 두 장의 머리와 내용 사이 여백은 여기 한 곳에서 잡는다. */}
      <div className="mt-11 w-full">{children}</div>
    </div>
  );
}

interface ProfileCardProps {
  nickname: string;
  photoUrl: string;
  gender: string;
  summary: string;
  mbtiNickname?: string;
  tags: string[];
  activities: string[];
}

/**
 * 방금 만든 프로필 한 장.
 *
 * 사진을 올렸든 안 올렸든 같은 카드를 쓴다. 사진이 있을 때만 폴라로이드를
 * 쓰던 때는 두 경우가 아예 다른 화면처럼 보였는데, 아바타 원 안의 내용만
 * 달라지게 두면 차이가 거기서 끝난다. 앱의 다른 화면도 전부 원형 아바타라
 * 다음 화면으로 넘어가도 같은 사람으로 읽힌다.
 */
function ProfileCard({
  nickname,
  photoUrl,
  gender,
  summary,
  mbtiNickname,
  tags,
  activities,
}: ProfileCardProps) {
  return (
    <div className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-5 py-6 text-center">
      <div className="flex justify-center">
        {/* 사진이 없으면 Avatar가 성별 기본 이미지로 채운다 — 탐색에서 보일 모습 그대로다. */}
        <Avatar
          name={nickname}
          size="xl"
          photoUrl={photoUrl || null}
          gender={gender}
        />
      </div>

      <p className="mt-3.5 text-[24px] font-bold text-(--color-text-strong)">
        {nickname}
      </p>
      {summary ? (
        <p className="mt-1.5 text-[13px] text-(--color-text-sub)">{summary}</p>
      ) : null}
      {mbtiNickname ? (
        <p className="mt-1 text-[13px] font-bold text-(--color-primary)">
          {mbtiNickname}
        </p>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      ) : null}

      {activities.length > 0 ? (
        <div className="mt-4 border-t border-(--color-border) pt-4">
          <p className="text-[11px] font-bold text-(--color-text-sub)">
            하고 싶은 활동
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {activities.map((activity) => (
              <Tag key={activity}>{activity}</Tag>
            ))}
          </div>
        </div>
      ) : null}

      {/* 하루짜리 부스에서 만든 프로필이라는 걸 남겨둔다. */}
      <p className="mt-5 text-[10px] tracking-wider text-(--color-text-muted)">
        {EVENT.period} · 용마대동제
      </p>
    </div>
  );
}

/**
 * 콕이 어떻게 되는지를 글 대신 그림으로 보여주는 고정 예시.
 *
 * 실제 참가자 이름을 쓰면 부스에 같은 이름이 있을 때 진짜 사용자로 오해하므로
 * 마스코트만 쓴다. 양쪽 모두 "콕 완료"인 이유는, 한쪽만 누른 그림에 가운데
 * 하트가 떠 있으면 한 번만 눌러도 매칭되는 것처럼 읽히기 때문이다.
 */
function KokExample() {
  return (
    /*
     * mt-2는 "예시" 라벨이 카드 위로 8px 튀어나온 만큼을 도로 밀어주는 것이다.
     * 이게 없으면 위 문구와의 여백이 선언한 값보다 그만큼 좁아 보인다.
     */
    <div className="relative mt-2 flex items-center justify-center gap-5">
      <ExampleCard name="용용이" src="/mascots/yy.png" className="-rotate-6" />
      <ExampleCard name="용블리" src="/mascots/yb.png" className="rotate-6" />
      <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-(--radius-full) border-[3px] border-(--color-chat-bg) bg-(--color-accent) text-(--color-text-on-primary)">
        <Check className="h-5 w-5" strokeWidth={3} />
      </span>
    </div>
  );
}

function ExampleCard({
  name,
  src,
  className,
}: {
  name: string;
  src: string;
  className: string;
}) {
  return (
    <div
      className={`relative w-[116px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-2.5 pb-2.5 pt-3.5 ${className}`}
    >
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-(--radius-full) bg-(--color-text-strong) px-2 py-0.5 text-[10px] font-bold text-(--color-text-on-primary)">
        예시
      </span>
      {/*
        실제 프로필과 같은 원형으로 담는다 — 네모 칸에 넣으면 이 카드만 앱의
        다른 아바타와 생김새가 달라져서, 참가자 카드를 흉내 낸 예시로 안 읽힌다.
        마스코트는 정사각형이 아니라 잘라내지 않고 통째로 넣는다.
      */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-(--radius-full) bg-(--color-primary-light)">
        <Image src={src} alt="" width={84} height={64} className="h-11 w-auto" />
      </div>
      <p className="mt-2 text-[13px] font-bold text-(--color-text-strong)">
        {name}
      </p>
      <div className="mt-2 flex h-7 items-center justify-center gap-1 rounded-(--radius-sm) bg-(--color-accent) text-[11.5px] font-bold text-(--color-text-on-primary)">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        콕 완료
      </div>
    </div>
  );
}
