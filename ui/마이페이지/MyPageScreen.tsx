"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Pencil, Smartphone } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { InstallGuideSheet } from "@ui/공통/InstallGuideSheet";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { TabBarMain } from "@ui/공통/TabBar";
import { Toast } from "@ui/공통/Toast";
import { usePwaInstall } from "@ui/공통/pwaInstall";
import { useSession } from "@ui/공통/session";
import { authErrorMessage, logout } from "@ui/로그인/authApi";
import { getCooks } from "@ui/받은콕/cookApi";
import { getMatches } from "@ui/매칭/matchApi";
import {
  getMyProfile,
  profileErrorMessage,
  updateMyProfile,
  type ProfileResponse,
} from "@ui/프로필작성/profileApi";
import { ProfileEditSheet, type ProfileEdit } from "./ProfileEditSheet";
import {
  disablePushNotifications,
  enablePushNotifications,
  getNotificationPermission,
  hasPushSubscription,
  notificationErrorMessage,
} from "./notificationApi";

type PushStatus = "checking" | "disabled" | "enabled" | "denied" | "unsupported";

export function MyPageScreen() {
  const router = useRouter();
  const { signOut } = useSession();
  const { installState, promptInstall } = usePwaInstall();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushStatus>("checking");
  const [isUpdatingPush, setIsUpdatingPush] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [sentCookCount, setSentCookCount] = useState(0);
  const [receivedCookCount, setReceivedCookCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    let active = true;

    getMyProfile()
      .then((response) => {
        if (active) setProfile(response);
      })
      .catch((error) => {
        if (active) setProfileError(profileErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([getCooks(), getMatches()])
      .then(([cooks, matches]) => {
        if (!active) return;
        setSentCookCount(cooks.usage.totalUsed);
        setReceivedCookCount(cooks.received.length);
        setMatchCount(matches.length);
      })
      .catch(() => {
        // 숫자는 부가 정보라 조회 실패해도 화면 전체를 막지 않는다.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadPushStatus = async () => {
      const permission = getNotificationPermission();
      if (permission === "unsupported") {
        if (active) setPushStatus("unsupported");
        return;
      }
      if (permission === "denied") {
        if (active) setPushStatus("denied");
        return;
      }

      try {
        const subscribed = await hasPushSubscription();
        if (active) setPushStatus(subscribed ? "enabled" : "disabled");
      } catch {
        if (active) setPushStatus("disabled");
      }
    };

    void loadPushStatus();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (edit: ProfileEdit) => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      setProfile(await updateMyProfile(edit));
      setIsEditOpen(false);
      setToastMessage("프로필을 저장했어요.");
    } catch (error) {
      setSaveError(profileErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInstall = async () => {
    // 사파리는 설치 프롬프트가 없어서 수동 안내로 보낸다.
    if (installState === "manual") {
      setIsInstallGuideOpen(true);
      return;
    }

    const outcome = await promptInstall();
    if (outcome === "dismissed") {
      setToastMessage("홈 화면에 추가하면 알림을 놓치지 않아요.");
    }
  };

  const handlePushToggle = async () => {
    if (isUpdatingPush || pushStatus === "checking") return;
    if (pushStatus === "unsupported") {
      setToastMessage("이 브라우저에서는 푸시 알림을 사용할 수 없어요.");
      return;
    }
    if (pushStatus === "denied") {
      setToastMessage("사이트 설정에서 알림 권한을 허용해주세요.");
      return;
    }

    setIsUpdatingPush(true);
    try {
      if (pushStatus === "enabled") {
        await disablePushNotifications();
        setPushStatus("disabled");
        setToastMessage("푸시 알림을 껐어요.");
      } else {
        await enablePushNotifications();
        setPushStatus("enabled");
        setToastMessage("푸시 알림을 켰어요.");
      }
    } catch (error) {
      if (getNotificationPermission() === "denied") setPushStatus("denied");
      setToastMessage(notificationErrorMessage(error));
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
      signOut();
      // push면 뒤로가기로 마이페이지에 돌아올 수 있다.
      router.replace("/");
    } catch (error) {
      setToastMessage(authErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <PhoneFrame>
      <Toast
        open={toastMessage !== null}
        message={toastMessage ?? ""}
        onDismiss={() => setToastMessage(null)}
      />

      <TabBarMain>
        {isLoading ? (
          <p className="py-20 text-center text-sm text-(--color-text-sub)">
            프로필을 불러오는 중...
          </p>
        ) : null}

        {profileError ? (
          <p role="alert" className="py-20 text-center text-sm text-(--color-danger)">
            {profileError}
          </p>
        ) : null}

        {profile ? (
          <>
            <Hero
              profile={profile}
              sent={sentCookCount}
              received={receivedCookCount}
              matched={matchCount}
              onEdit={() => {
                setSaveError(null);
                setIsEditOpen(true);
              }}
            />

            <div className="flex flex-col gap-3 px-4 pb-6 pt-5">
              <InfoCard emoji="🏫" label="학과" value={departmentLine(profile)} />
              <InfoCard emoji="🎂" label="나이" value={`${profile.age}세`} />
              <InfoCard emoji="🧠" label="MBTI" value={profile.mbti} />
              <InfoCard emoji="🎯" label="취미" value={hobbyLine(profile)} />
              <InfoCard
                emoji="💬"
                label="한 마디"
                value={profile.bio || "아직 없어요"}
                muted={!profile.bio}
              />

              <div className="mt-3 flex flex-col gap-2">
                {installState === "available" || installState === "manual" ? (
                  <SettingRow
                    icon={<Smartphone className="h-4 w-4 text-(--color-primary)" />}
                    title="홈 화면에 추가"
                    note={
                      installState === "manual"
                        ? "아이폰은 추가해야 알림을 받을 수 있어요"
                        : "앱처럼 전체화면으로 쓸 수 있어요"
                    }
                    action={installState === "manual" ? "방법 보기" : "추가"}
                    highlight
                    onClick={() => void handleInstall()}
                  />
                ) : null}

                <SettingRow
                  icon={<Bell className="h-4 w-4 text-(--color-text-muted)" />}
                  title="푸시 알림"
                  note={pushStatusLabel(pushStatus)}
                  action={
                    isUpdatingPush
                      ? "처리 중..."
                      : pushStatus === "enabled"
                        ? "끄기"
                        : "켜기"
                  }
                  disabled={isUpdatingPush || pushStatus === "checking"}
                  onClick={() => void handlePushToggle()}
                />
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="mt-2 rounded-(--radius-lg) bg-(--color-surface-alt) py-4 text-sm font-bold text-(--color-text-sub) disabled:text-(--color-text-muted)"
              >
                {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
              </button>
            </div>
          </>
        ) : null}
      </TabBarMain>

      <BottomSheet open={isEditOpen} onClose={() => !isSaving && setIsEditOpen(false)}>
        {profile ? (
          <ProfileEditSheet
            profile={profile}
            isSubmitting={isSaving}
            error={saveError}
            onSave={handleSave}
            onCancel={() => setIsEditOpen(false)}
          />
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      >
        <InstallGuideSheet onClose={() => setIsInstallGuideOpen(false)} />
      </BottomSheet>
    </PhoneFrame>
  );
}

function Hero({
  profile,
  sent,
  received,
  matched,
  onEdit,
}: {
  profile: ProfileResponse;
  sent: number;
  received: number;
  matched: number;
  onEdit: () => void;
}) {
  return (
    <section
      className="flex shrink-0 flex-col items-center px-5 pb-6 pt-3 text-center text-(--color-hero-text)"
      style={{
        backgroundImage:
          "linear-gradient(160deg, var(--color-me-from), var(--color-me-to))",
      }}
    >
      <div className="flex w-full justify-end">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-2 text-[13px] font-bold text-(--color-hero-text)"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          수정하기
        </button>
      </div>

      <Avatar
        name={profile.nickname}
        userId={profile.userId}
        photoUrl={profile.photo}
        gender={profile.gender}
        size="2xl"
        className="mt-1 ring-4 ring-white/35"
      />

      <p className="mt-3 text-2xl font-extrabold">{profile.nickname}</p>

      <p className="mt-1.5 flex items-center gap-2 text-sm text-white/75">
        <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold text-(--color-hero-text)">
          {profile.mbti}
        </span>
        {profile.department ?? "학과 미등록"}
      </p>

      {/* 세 숫자가 "내가 이 부스에서 뭘 했나"를 한 줄로 답한다. */}
      <dl className="mt-5 flex w-full rounded-(--radius-lg) bg-white/15">
        <Stat label="보낸 콕" value={sent} />
        <Stat label="받은 콕" value={received} divided />
        <Stat label="매칭" value={matched} divided />
      </dl>
    </section>
  );
}

function Stat({
  label,
  value,
  divided = false,
}: {
  label: string;
  value: number;
  divided?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-0.5 py-4 ${
        divided ? "border-l border-white/20" : ""
      }`}
    >
      <dd className="text-xl font-extrabold tabular-nums">{value}</dd>
      <dt className="text-xs text-white/70">{label}</dt>
    </div>
  );
}

function InfoCard({
  emoji,
  label,
  value,
  muted = false,
}: {
  emoji: string;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1.25rem] bg-(--color-surface) p-4 shadow-(--shadow-card)">
      <span className="text-2xl" aria-hidden="true">
        {emoji}
      </span>
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <span className="text-xs text-(--color-text-muted)">{label}</span>
        <span
          className={`truncate text-[15px] font-bold ${
            muted ? "text-(--color-text-muted)" : "text-(--color-text-strong)"
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  note,
  action,
  highlight = false,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
  action: string;
  highlight?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between rounded-(--radius-lg) px-4 py-3.5 text-left disabled:text-(--color-text-muted) ${
        highlight
          ? "border border-(--color-primary) bg-(--color-primary-lighter)"
          : "border border-(--color-border) bg-(--color-surface)"
      }`}
    >
      <span className="flex items-center gap-2.5 overflow-hidden">
        <span className="shrink-0">{icon}</span>
        <span className="flex flex-col overflow-hidden">
          <span className="text-sm font-medium text-(--color-text-strong)">{title}</span>
          <span className="truncate text-xs text-(--color-text-muted)">{note}</span>
        </span>
      </span>
      <span className="shrink-0 text-xs font-bold text-(--color-primary)">{action}</span>
    </button>
  );
}

function departmentLine(profile: ProfileResponse) {
  return [profile.department, profile.grade].filter(Boolean).join(" ") || "미등록";
}

function hobbyLine(profile: ProfileResponse) {
  return (
    profile.hobby
      .split(",")
      .map((hobby) => hobby.trim())
      .filter(Boolean)
      .join(" · ") || "미등록"
  );
}

function pushStatusLabel(status: PushStatus) {
  const labels: Record<PushStatus, string> = {
    checking: "설정을 확인하는 중...",
    disabled: "새 콕·매칭·메시지 알림을 받아보세요",
    enabled: "이 브라우저에서 알림을 받고 있어요",
    denied: "브라우저에서 알림 권한이 차단됐어요",
    unsupported: "이 브라우저에서는 지원하지 않아요",
  };
  return labels[status];
}
