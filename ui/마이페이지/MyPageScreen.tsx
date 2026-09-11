"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, Lock, Shield, Sparkles } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { StatCard } from "@ui/공통/StatCard";
import { Tag } from "@ui/공통/Tag";
import { TabBar } from "@ui/공통/TabBar";
import { Toast } from "@ui/공통/Toast";
import { useSession } from "@ui/공통/session";
import { authErrorMessage, logout } from "@ui/로그인/authApi";
import {
  getMyProfile,
  profileErrorMessage,
  type ProfileResponse,
  updateMyProfile,
} from "@ui/프로필작성/profileApi";
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
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");
  const [grade, setGrade] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<PushStatus>("checking");
  const [isUpdatingPush, setIsUpdatingPush] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setProfileError(null);
      try {
        const response = await getMyProfile();
        if (!active) return;
        setProfile(response);
        setBio(response.bio ?? "");
        setDepartment(response.department ?? "");
        setGrade(response.grade ?? "");
      } catch (error) {
        if (active) setProfileError(profileErrorMessage(error));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadProfile();
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

  const handleProfileUpdate = async () => {
    if (!profile || isSubmitting) return;

    setIsSubmitting(true);
    setProfileError(null);
    try {
      const response = await updateMyProfile({ department, grade, bio });
      setProfile(response);
      setBio(response.bio ?? "");
      setDepartment(response.department ?? "");
      setGrade(response.grade ?? "");
    } catch (error) {
      setProfileError(profileErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      signOut();
      router.push("/login");
    } catch (error) {
      setLogoutError(authErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
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

  return (
    <PhoneFrame>
      <Toast
        open={toastMessage !== null}
        message={toastMessage ?? ""}
        onDismiss={() => setToastMessage(null)}
      />
      <header className="flex h-14 w-full shrink-0 items-center gap-2 border-b border-(--color-border) bg-(--color-surface) px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--color-primary) text-(--color-text-on-primary)">
          <Sparkles className="h-4 w-4" />
        </span>
        <h1 className="text-lg font-bold text-(--color-text-strong)">마이</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <div className="flex flex-col gap-5 p-4">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-(--color-text-sub)">
              프로필을 불러오는 중...
            </p>
          ) : profile ? (
            <div className="flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
              <Avatar name={profile.nickname} size="xl" online />
              <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-(--color-text-strong)">
                    {profile.nickname}
                  </span>
                  <Tag variant="primary">{profile.mbti}</Tag>
                </div>
                <span className="truncate text-xs text-(--color-text-sub)">
                  {[`${profile.age}세`, profile.bloodType, profile.department, profile.grade]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleProfileUpdate}
              >
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          ) : null}

          {profileError ? (
            <p role="alert" className="text-[12px] text-(--color-danger)">
              {profileError}
            </p>
          ) : null}

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
              <label className="text-xs font-medium text-(--color-text-sub)">
                학과 · 학년
              </label>
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
                onClick={() => void handlePushToggle()}
                disabled={isUpdatingPush || pushStatus === "checking"}
                className="flex items-center justify-between rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-4 py-3 text-left disabled:text-(--color-text-muted)"
              >
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-(--color-text-muted)" aria-hidden="true" />
                  <span className="flex flex-col">
                    <span className="text-sm text-(--color-text-strong)">푸시 알림</span>
                    <span className="text-xs text-(--color-text-muted)">{pushStatusLabel(pushStatus)}</span>
                  </span>
                </span>
                <span className="text-xs font-semibold text-(--color-primary)">
                  {isUpdatingPush ? "처리 중..." : pushStatus === "enabled" ? "끄기" : "켜기"}
                </span>
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

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="py-1 text-left text-sm text-(--color-text-sub) disabled:text-(--color-text-muted)"
            >
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </button>

            {logoutError ? (
              <p role="alert" className="text-[12px] text-(--color-danger)">
                {logoutError}
              </p>
            ) : null}
          </div>
        </div>
      </main>

      <TabBar />
    </PhoneFrame>
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
