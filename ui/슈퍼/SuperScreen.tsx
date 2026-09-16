"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, MessageCircle, Users } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { PhotoViewer } from "@ui/공통/PhotoViewer";
import { Tag } from "@ui/공통/Tag";
import { TextField } from "@ui/공통/TextField";
import { resolveAvatarPhoto } from "@ui/공통/avatarColor";
import { useSession } from "@ui/공통/session";
import { authErrorMessage, login, logout } from "@ui/로그인/authApi";
import {
  SuperApiError,
  getSuperChats,
  getSuperUsers,
  superErrorMessage,
  type SuperChatRoomResponse,
  type SuperUserResponse,
} from "./superApi";

type SuperTab = "users" | "chats";

/**
 * 총학생회 전용. 기존 참가자·관리자 화면과 주소를 나눈다.
 * /super 에서 로그인하면 바로 유저·채팅방 목록이 열린다.
 */
export function SuperScreen() {
  const { session, signOut } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<SuperTab>("users");
  const [users, setUsers] = useState<SuperUserResponse[]>([]);
  const [chats, setChats] = useState<SuperChatRoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuper = session.role === "super";

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [userList, chatList] = await Promise.all([
        getSuperUsers(),
        getSuperChats(),
      ]);
      setUsers(userList);
      setChats(chatList);
    } catch (loadError) {
      if (loadError instanceof SuperApiError && loadError.code === "UNAUTHORIZED") {
        await logout().catch(() => undefined);
        signOut();
        return;
      }
      setError(superErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    if (!isSuper) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [isSuper, load]);

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    signOut();
  };

  if (!isSuper) {
    return <SuperLoginForm />;
  }

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-(--color-border) bg-(--color-surface) px-4">
        <h1 className="flex-1 truncate text-base font-bold text-(--color-text-strong)">
          총학생회
        </h1>
        <span className="truncate text-xs text-(--color-text-sub)">
          {session.name}
        </span>
        <button
          type="button"
          onClick={() => void handleLogout()}
          aria-label="로그아웃"
          className="p-1 text-(--color-text-muted)"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto bg-(--color-bg)">
        {isLoading || error ? (
          <div
            role={error ? "alert" : undefined}
            className={`flex min-h-72 flex-col items-center justify-center gap-3 px-6 text-center text-sm ${
              error ? "text-(--color-danger)" : "text-(--color-text-sub)"
            }`}
          >
            <span>{error ?? "불러오는 중..."}</span>
            {error ? (
              <Button size="sm" variant="outline" onClick={() => void load()}>
                다시 시도
              </Button>
            ) : null}
          </div>
        ) : tab === "users" ? (
          <UserList users={users} />
        ) : (
          <ChatList
            chats={chats}
            onOpen={(matchId) => router.push(`/super/chats/${matchId}`)}
          />
        )}
      </main>

      <nav className="flex h-16 w-full shrink-0 items-stretch border-t border-(--color-border) bg-(--color-surface)">
        <TabButton
          label="유저"
          icon={Users}
          active={tab === "users"}
          count={users.length}
          onClick={() => setTab("users")}
        />
        <TabButton
          label="채팅방"
          icon={MessageCircle}
          active={tab === "chats"}
          count={chats.length}
          onClick={() => setTab("chats")}
        />
      </nav>
    </PhoneFrame>
  );
}

function SuperLoginForm() {
  const { signIn } = useSession();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = loginId.trim().length > 0 && password.length > 0;

  const submit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await login(loginId, password);
      if (user.role !== "super") {
        await logout().catch(() => {});
        setError("슈퍼 권한이 없는 계정입니다.");
        return;
      }
      signIn({ role: "super", name: user.email });
    } catch (submitError) {
      setError(authErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col bg-(--color-primary-lighter) px-6 pb-10 pt-10">
        <div className="flex flex-1 flex-col justify-center">
          <p className="mb-2 text-center text-[13px] font-semibold text-(--color-text-sub)">
            총학생회 전용
          </p>
          <h1 className="mb-8 text-center text-2xl font-extrabold text-(--color-text-strong)">
            콕찔러보기
          </h1>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (canSubmit) void submit();
            }}
          >
            <div className="space-y-4">
              <TextField
                label="아이디"
                tone="soft"
                autoComplete="username"
                value={loginId}
                onChange={(event) => {
                  setLoginId(event.target.value);
                  setError(null);
                }}
              />
              <TextField
                label="비밀번호"
                tone="soft"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
              />
              {error ? (
                <p role="alert" className="text-[12px] text-(--color-danger)">
                  {error}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              fullWidth
              className="mt-7 rounded-(--radius-full)"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className="mt-6">
            <InfoBox>참가자·부스 관리자 화면과 분리된 조회 화면입니다.</InfoBox>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function UserList({ users }: { users: SuperUserResponse[] }) {
  const [photo, setPhoto] = useState<string | null>(null);

  if (users.length === 0) {
    return (
      <p className="py-14 text-center text-sm text-(--color-text-sub)">
        등록된 유저가 없어요
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3 p-4">
        {users.map((user) => {
          const photoUrl = resolveAvatarPhoto(user.photo, user.gender);
          return (
            <li
              key={user.userId}
              className="flex flex-col gap-3 rounded-[1.25rem] bg-(--color-surface) p-4 shadow-(--shadow-card)"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="shrink-0"
                  onClick={() => setPhoto(photoUrl)}
                  aria-label="프로필 사진 크게 보기"
                >
                  <Avatar
                    name={user.nickname ?? user.email}
                    size="xl"
                    userId={user.userId}
                    photoUrl={user.photo}
                    gender={user.gender}
                    suspended={user.status === "suspended"}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[15px] font-bold text-(--color-text-strong)">
                      {user.nickname ?? "닉네임 없음"}
                    </span>
                    <Tag variant={roleTag(user.role)}>{roleLabel(user.role)}</Tag>
                    {user.status === "suspended" ? (
                      <Tag variant="warning">정지</Tag>
                    ) : null}
                  </div>
                  <p className="mt-1 break-all text-[13px] font-medium text-(--color-text-strong)">
                    {user.email}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-1 text-[13px]">
                <InfoRow label="성별" value={user.gender} />
                <InfoRow label="나이" value={user.age ? `${user.age}세` : null} />
                <InfoRow label="MBTI" value={user.mbti} />
                <InfoRow label="혈액형" value={user.bloodType} />
                <InfoRow label="학과" value={user.department} />
                <InfoRow label="학년" value={user.grade} />
                <InfoRow label="취미" value={user.hobby} />
                <InfoRow label="소개" value={user.bio} />
                <InfoRow label="이상형" value={user.idealType} />
              </dl>
            </li>
          );
        })}
      </ul>
      {photo ? <PhotoViewer photoUrl={photo} onClose={() => setPhoto(null)} /> : null}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-(--color-text-muted)">{label}</dt>
      <dd className="break-all text-(--color-text-body)">{value || "-"}</dd>
    </>
  );
}

function ChatList({
  chats,
  onOpen,
}: {
  chats: SuperChatRoomResponse[];
  onOpen: (matchId: number) => void;
}) {
  if (chats.length === 0) {
    return (
      <p className="py-14 text-center text-sm text-(--color-text-sub)">
        열린 채팅방이 없어요
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 p-4">
      {chats.map((chat) => (
        <li key={chat.matchId}>
          <button
            type="button"
            onClick={() => onOpen(chat.matchId)}
            className="flex w-full items-center gap-3 rounded-[1.25rem] bg-(--color-surface) p-4 text-left shadow-(--shadow-card)"
          >
            <div className="flex -space-x-2">
              <Avatar
                name={memberName(chat.userA)}
                size="md"
                userId={chat.userA.userId}
                photoUrl={chat.userA.photo}
                gender={chat.userA.gender}
              />
              <Avatar
                name={memberName(chat.userB)}
                size="md"
                userId={chat.userB.userId}
                photoUrl={chat.userB.photo}
                gender={chat.userB.gender}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-(--color-text-strong)">
                {memberName(chat.userA)} · {memberName(chat.userB)}
              </p>
              <p className="break-all text-[12px] text-(--color-text-sub)">
                {chat.userA.email ?? "-"} / {chat.userB.email ?? "-"}
              </p>
              <p className="mt-1 truncate text-[13px] text-(--color-text-sub)">
                {chat.lastMessage ?? "아직 메시지가 없어요"}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-(--color-text-muted)">
              {formatStamp(chat.lastMessageAt ?? chat.matchedAt)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function TabButton({
  label,
  icon: Icon,
  active,
  count,
  onClick,
}: {
  label: string;
  icon: typeof Users;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  const color = active
    ? "text-(--color-primary)"
    : "text-(--color-text-muted)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-1 flex-col items-center justify-center gap-1"
    >
      <span className="relative">
        <Icon className={`h-5 w-5 ${color}`} />
        {count > 0 ? (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-(--radius-full) bg-(--color-primary) px-1 text-[10px] font-semibold text-(--color-text-on-primary)">
            {count}
          </span>
        ) : null}
      </span>
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    </button>
  );
}

function memberName(member: SuperChatRoomResponse["userA"]) {
  return member.nickname ?? member.email ?? `참가자 #${member.userId}`;
}

function roleLabel(role: string) {
  if (role === "admin") return "관리자";
  if (role === "super") return "슈퍼";
  return "참가자";
}

function roleTag(role: string): "primary" | "warning" | "default" {
  if (role === "admin") return "warning";
  if (role === "super") return "primary";
  return "default";
}

function formatStamp(value: string) {
  return value.split("T")[1]?.slice(0, 5) ?? value;
}
