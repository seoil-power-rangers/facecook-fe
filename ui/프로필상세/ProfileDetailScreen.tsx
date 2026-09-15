"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Footprints, Send, Siren, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { Button } from "@ui/공통/Button";
import { KokConfirmSheet } from "@ui/공통/KokConfirmSheet";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { PhotoViewer } from "@ui/공통/PhotoViewer";
import { Tag } from "@ui/공통/Tag";
import { Toast } from "@ui/공통/Toast";
import {
  getMyProfile,
  getProfile,
  profileErrorMessage,
  type ProfileResponse,
} from "@ui/프로필작성/profileApi";
import { cookErrorMessage, getCooks, sendCook } from "@ui/받은콕/cookApi";

const HOBBY_ICONS: LucideIcon[] = [Utensils, Footprints, Send];

export function ProfileDetailScreen({ userId }: { userId: string }) {
  const router = useRouter();
  const numericUserId = Number(userId);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [commonCount, setCommonCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kokSheetOpen, setKokSheetOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [kokRemaining, setKokRemaining] = useState<number | null>(null);
  const [kokLimit, setKokLimit] = useState<number | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      setError("올바르지 않은 프로필 주소예요.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const target = await getProfile(numericUserId);
      setProfile(target);

      try {
        const mine = await getMyProfile();
        setCommonCount(commonHobbies(target.hobby, mine.hobby));
      } catch {
        setCommonCount(0);
      }

      // 콕 확인 시트가 "오늘 남은 콕"을 보여준다. 실패해도 프로필은 그대로
      // 보여준다 — 부가 정보 하나 때문에 화면 전체를 못 보게 할 일은 아니다.
      try {
        const cooks = await getCooks();
        setKokRemaining(Math.max(cooks.usage.dailyLimit - cooks.usage.todayUsed, 0));
        setKokLimit(cooks.usage.dailyLimit);
      } catch {
        setKokRemaining(null);
        setKokLimit(null);
      }
    } catch (loadError) {
      setError(profileErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [numericUserId]);

  useEffect(() => {
    // 라우트의 userId가 바뀌면 해당 프로필을 다시 불러온다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
  }, [loadProfile]);

  const handleSendCook = async () => {
    if (!profile) return;
    setIsSending(true);
    try {
      const result = await sendCook(profile.userId);
      setKokSheetOpen(false);
      if (result.matched && result.matchId !== null) {
        router.push(`/match/${result.matchId}/matched`);
        return;
      }
      setToastMessage("콕을 보냈어요. 상대의 콕을 기다려주세요.");
    } catch (sendError) {
      setToastMessage(cookErrorMessage(sendError));
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || error || !profile) {
    return (
      <PhoneFrame>
        <header className="flex h-14 shrink-0 items-center border-b border-(--color-border) bg-(--color-surface) px-3">
          <button type="button" aria-label="뒤로가기" className="p-1" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </button>
        </header>
        <div
          role={error ? "alert" : undefined}
          className={`flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm ${
            error ? "text-(--color-danger)" : "text-(--color-text-sub)"
          }`}
        >
          <span>{error ?? "프로필을 불러오는 중..."}</span>
          {error ? (
            <Button size="sm" variant="outline" onClick={() => void loadProfile()}>
              다시 시도
            </Button>
          ) : null}
        </div>
      </PhoneFrame>
    );
  }

  const hobbies = splitHobbies(profile.hobby);
  const infoRows = [
    { label: "MBTI", value: profile.mbti },
    { label: "혈액형", value: bloodTypeLabel(profile.bloodType) },
    { label: "성별", value: genderLabel(profile.gender) },
    { label: "나이", value: `${profile.age}세` },
  ];
  // 이름은 제목으로 올라갔으니 여기서 뺀다.
  const subInfo = [`${profile.age}세`, profile.department, profile.grade]
    .filter(Boolean)
    .join(" · ");

  return (
    <PhoneFrame>
      <Toast
        open={toastMessage !== null}
        message={toastMessage ?? ""}
        onDismiss={() => setToastMessage(null)}
      />

      <div className="flex-1 overflow-y-auto">
        {/*
          아래 여백은 아바타가 올라오는 높이(-mt-12 = 48px)보다 커야 한다.
          작으면 아바타가 부제 글씨를 덮는다.
        */}
        <div className="bg-(--color-accent-soft) px-4 pb-20 pt-3 text-(--color-text-strong)">
          <div className="flex items-center justify-between">
            <button type="button" aria-label="뒤로가기" className="p-1" onClick={() => router.back()}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <Link href={`/profile/${userId}/report`} aria-label="신고" className="p-1">
              <Siren className="h-4 w-4" />
            </Link>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold">{profile.nickname}</h1>
          <p className="mt-1 text-sm text-(--color-text-sub)">{subInfo}</p>
        </div>

        <div className="-mt-12 flex flex-col items-center gap-2">
          {profile.photo ? (
            <button
              type="button"
              aria-label="프로필 사진 크게 보기"
              onClick={() => setPhotoViewerOpen(true)}
            >
              <Avatar
                name={profile.nickname}
                userId={profile.userId}
                photoUrl={profile.photo}
                size="2xl"
                className="ring-4 ring-(--color-surface)"
              />
            </button>
          ) : (
            <Avatar
              name={profile.nickname}
              userId={profile.userId}
              size="2xl"
              className="ring-4 ring-(--color-surface)"
            />
          )}
          {commonCount > 0 ? <Tag variant="accent">공통 관심사 {commonCount}개</Tag> : null}
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
              {profile.bio || "아직 작성한 자기소개가 없어요."}
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-(--color-text-strong)">이런 걸 하고 싶어요</h2>
            {hobbies.length > 0 ? (
              <div className="flex flex-wrap justify-around gap-4">
                {hobbies.map((hobby, index) => {
                  const HobbyIcon = HOBBY_ICONS[index % HOBBY_ICONS.length];
                  return (
                    <div key={hobby} className="flex min-w-20 flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
                        <HobbyIcon className="h-6 w-6" />
                      </div>
                      <span className="text-xs text-(--color-text-sub)">{hobby}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-(--color-text-sub)">등록한 관심사가 없어요.</p>
            )}
          </section>

          {profile.idealType ? (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-(--color-text-strong)">이상형</h2>
              <p className="rounded-(--radius-lg) bg-(--color-surface-alt) p-4 text-sm text-(--color-text-body)">
                {profile.idealType}
              </p>
            </section>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-(--color-border) bg-(--color-surface) p-4">
        <button
          type="button"
          onClick={() => setKokSheetOpen(true)}
          className="flex h-[54px] w-full items-center justify-center rounded-(--radius-lg) bg-(--color-accent) text-base font-bold text-(--color-text-on-primary) transition-colors hover:bg-(--color-accent-hover) active:bg-(--color-accent-pressed)"
        >
          콕 보내기
        </button>
      </div>

      <BottomSheet open={kokSheetOpen} onClose={() => !isSending && setKokSheetOpen(false)}>
        <KokConfirmSheet
          name={profile.nickname}
          userId={profile.userId}
          remaining={kokRemaining}
          dailyLimit={kokLimit}
          photoUrl={profile.photo}
          onCancel={() => setKokSheetOpen(false)}
          onConfirm={() => void handleSendCook()}
          isSubmitting={isSending}
        />
      </BottomSheet>

      {photoViewerOpen && profile.photo ? (
        <PhotoViewer
          photoUrl={profile.photo}
          alt={`${profile.nickname} 프로필 사진`}
          onClose={() => setPhotoViewerOpen(false)}
        />
      ) : null}
    </PhoneFrame>
  );
}

function splitHobbies(hobby: string) {
  return hobby.split(",").map((item) => item.trim()).filter(Boolean);
}

function commonHobbies(targetHobby: string, myHobby: string) {
  const mine = new Set(splitHobbies(myHobby));
  return splitHobbies(targetHobby).filter((hobby) => mine.has(hobby)).length;
}

function genderLabel(gender: string) {
  const labels: Record<string, string> = {
    male: "남성",
    female: "여성",
    man: "남성",
    woman: "여성",
  };
  return labels[gender.toLowerCase()] ?? gender;
}

function bloodTypeLabel(bloodType: string) {
  return bloodType.endsWith("형") ? bloodType : `${bloodType}형`;
}
