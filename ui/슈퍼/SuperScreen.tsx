"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageCircle,
  Search,
  Users,
} from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";
import { TextField } from "@ui/공통/TextField";
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

interface DashboardState {
  tab: SuperTab;
  chatSearch: string;
  userPage: number;
  scrollTop: Record<SuperTab, number>;
}

const USERS_PER_PAGE = 8;
const DASHBOARD_STATE_KEY = "facecook:super-dashboard";
const DEFAULT_DASHBOARD_STATE: DashboardState = {
  tab: "users",
  chatSearch: "",
  userPage: 1,
  scrollTop: { users: 0, chats: 0 },
};

/** 총학생회 전용 유저·채팅 조회 화면. */
export function SuperScreen() {
  const { session, signOut } = useSession();
  const router = useRouter();
  const mainRef = useRef<HTMLElement>(null);
  const scrollTopRef = useRef<Record<SuperTab, number>>({ users: 0, chats: 0 });
  const [tab, setTab] = useState<SuperTab>("users");
  const [chatSearch, setChatSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [stateRestored, setStateRestored] = useState(false);
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
      if (
        loadError instanceof SuperApiError &&
        (loadError.code === "UNAUTHORIZED" || loadError.code === "FORBIDDEN")
      ) {
        clearDashboardState();
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
    const saved = readDashboardState();
    queueMicrotask(() => {
      setTab(saved.tab);
      setChatSearch(saved.chatSearch);
      setUserPage(saved.userPage);
      scrollTopRef.current = saved.scrollTop;
      setStateRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!isSuper) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [isSuper, load]);

  useEffect(() => {
    if (!stateRestored) return;
    writeDashboardState({
      tab,
      chatSearch,
      userPage,
      scrollTop: scrollTopRef.current,
    });
  }, [chatSearch, stateRestored, tab, userPage]);

  useEffect(() => {
    if (!stateRestored || isLoading) return;
    const frame = requestAnimationFrame(() => {
      if (mainRef.current)
        mainRef.current.scrollTop = scrollTopRef.current[tab];
    });
    return () => cancelAnimationFrame(frame);
  }, [
    chatSearch,
    chats.length,
    isLoading,
    stateRestored,
    tab,
    userPage,
    users.length,
  ]);

  const filteredChats = useMemo(
    () => filterChatsByMemberName(chats, chatSearch),
    [chats, chatSearch],
  );

  const rememberCurrentScroll = () => {
    if (mainRef.current) scrollTopRef.current[tab] = mainRef.current.scrollTop;
  };

  const persistCurrentState = () => {
    rememberCurrentScroll();
    writeDashboardState({
      tab,
      chatSearch,
      userPage,
      scrollTop: scrollTopRef.current,
    });
  };

  const handleTabChange = (nextTab: SuperTab) => {
    if (nextTab === tab) return;
    rememberCurrentScroll();
    setTab(nextTab);
  };

  const handleUserPageChange = (nextPage: number) => {
    scrollTopRef.current.users = 0;
    if (mainRef.current) mainRef.current.scrollTop = 0;
    setUserPage(nextPage);
  };

  const handleChatSearchChange = (value: string) => {
    scrollTopRef.current.chats = 0;
    if (mainRef.current) mainRef.current.scrollTop = 0;
    setChatSearch(value);
  };

  const handleLogout = async () => {
    clearDashboardState();
    await logout().catch(() => undefined);
    signOut();
  };

  if (!isSuper) return <SuperLoginForm />;

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

      <main
        ref={mainRef}
        onScroll={(event) => {
          scrollTopRef.current[tab] = event.currentTarget.scrollTop;
          writeDashboardState({
            tab,
            chatSearch,
            userPage,
            scrollTop: scrollTopRef.current,
          });
        }}
        className="flex-1 overflow-y-auto bg-(--color-bg)"
      >
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
          <UserList
            users={users}
            page={userPage}
            onPageChange={handleUserPageChange}
            onOpen={(userId) => {
              persistCurrentState();
              router.push(`/super/users/${userId}`);
            }}
          />
        ) : (
          <ChatList
            chats={filteredChats}
            search={chatSearch}
            onSearchChange={handleChatSearchChange}
            onOpen={(matchId) => {
              persistCurrentState();
              router.push(`/super/chats/${matchId}`);
            }}
          />
        )}
      </main>

      <nav className="flex h-16 w-full shrink-0 items-stretch border-t border-(--color-border) bg-(--color-surface)">
        <TabButton
          label="유저"
          icon={Users}
          active={tab === "users"}
          count={users.length}
          onClick={() => handleTabChange("users")}
        />
        <TabButton
          label="채팅방"
          icon={MessageCircle}
          active={tab === "chats"}
          count={chats.length}
          onClick={() => handleTabChange("chats")}
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
      clearDashboardState();
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

function UserList({
  users,
  page,
  onPageChange,
  onOpen,
}: {
  users: SuperUserResponse[];
  page: number;
  onPageChange: (page: number) => void;
  onOpen: (userId: number) => void;
}) {
  if (users.length === 0)
    return (
      <p className="py-14 text-center text-sm text-(--color-text-sub)">
        등록된 유저가 없어요
      </p>
    );

  const totalPages = Math.max(Math.ceil(users.length / USERS_PER_PAGE), 1);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageUsers = users.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE,
  );

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-xs text-(--color-text-sub)">
        <span>전체 {users.length}명</span>
        <span>
          {currentPage} / {totalPages} 페이지
        </span>
      </div>
      <ul className="mx-4 overflow-hidden rounded-[1.25rem] bg-(--color-surface) shadow-(--shadow-card)">
        {pageUsers.map((user) => {
          const canOpen =
            user.role.toLowerCase() === "participant" && user.nickname !== null;
          return (
            <li
              key={user.userId}
              className="border-b border-(--color-border) last:border-b-0"
            >
              <button
                type="button"
                disabled={!canOpen}
                onClick={() => canOpen && onOpen(user.userId)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left disabled:cursor-default"
                aria-label={canOpen ? `${user.nickname} 상세보기` : undefined}
              >
                <Avatar
                  name={user.nickname ?? user.email}
                  size="md"
                  userId={user.userId}
                  photoUrl={user.photo}
                  gender={user.gender ?? undefined}
                  suspended={user.status === "suspended"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-(--color-text-strong)">
                      {user.nickname ?? "닉네임 없음"}
                    </span>
                    <Tag variant={roleTag(user.role)}>
                      {roleLabel(user.role)}
                    </Tag>
                    {user.status === "suspended" ? (
                      <Tag variant="warning">정지</Tag>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-(--color-text-sub)">
                    {user.email}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-(--color-text-body)">
                    {[user.age ? `${user.age}세` : null, user.gender]
                      .filter(Boolean)
                      .join(" · ") || "-"}
                  </p>
                  {canOpen ? (
                    <ChevronRight className="ml-auto mt-1 h-4 w-4 text-(--color-text-muted)" />
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto flex items-center justify-center gap-4 bg-(--color-bg) px-4 py-4">
        <PageButton
          label="이전 유저 페이지"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>
        <span className="min-w-16 text-center text-sm font-semibold text-(--color-text-strong)">
          {currentPage} / {totalPages}
        </span>
        <PageButton
          label="다음 유저 페이지"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-text-body) disabled:opacity-35"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function ChatList({
  chats,
  search,
  onSearchChange,
  onOpen,
}: {
  chats: SuperChatRoomResponse[];
  search: string;
  onSearchChange: (value: string) => void;
  onOpen: (matchId: number) => void;
}) {
  return (
    <div>
      <div className="sticky top-0 z-10 bg-(--color-bg) px-4 pb-2 pt-4">
        <label className="relative block">
          <span className="sr-only">참가자 이름으로 채팅방 검색</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="참가자 이름으로 검색"
            className="h-11 w-full rounded-(--radius-full) border border-(--color-border) bg-(--color-surface) pl-10 pr-4 text-sm text-(--color-text-strong) outline-none placeholder:text-(--color-text-muted) focus:border-(--color-primary)"
          />
        </label>
      </div>
      {chats.length === 0 ? (
        <p className="py-14 text-center text-sm text-(--color-text-sub)">
          {search.trim()
            ? "이름과 일치하는 채팅방이 없어요"
            : "열린 채팅방이 없어요"}
        </p>
      ) : (
        <ul className="flex flex-col gap-2 p-4 pt-2">
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
                    gender={chat.userA.gender ?? undefined}
                  />
                  <Avatar
                    name={memberName(chat.userB)}
                    size="md"
                    userId={chat.userB.userId}
                    photoUrl={chat.userB.photo}
                    gender={chat.userB.gender ?? undefined}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-(--color-text-strong)">
                    {memberName(chat.userA)} · {memberName(chat.userB)}
                  </p>
                  <p className="truncate text-[12px] text-(--color-text-sub)">
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
      )}
    </div>
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
  const color = active ? "text-(--color-primary)" : "text-(--color-text-muted)";
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

function filterChatsByMemberName(
  chats: SuperChatRoomResponse[],
  search: string,
) {
  const keyword = search.trim().toLocaleLowerCase();
  if (!keyword) return chats;
  return chats.filter((chat) =>
    [chat.userA.nickname, chat.userB.nickname].some((nickname) =>
      nickname?.toLocaleLowerCase().includes(keyword),
    ),
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

function readDashboardState(): DashboardState {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_STATE;
  try {
    const raw = window.sessionStorage.getItem(DASHBOARD_STATE_KEY);
    if (!raw) return DEFAULT_DASHBOARD_STATE;
    const parsed = JSON.parse(raw) as Partial<DashboardState>;
    return {
      tab: parsed.tab === "chats" ? "chats" : "users",
      chatSearch:
        typeof parsed.chatSearch === "string" ? parsed.chatSearch : "",
      userPage:
        typeof parsed.userPage === "number" && parsed.userPage > 0
          ? Math.floor(parsed.userPage)
          : 1,
      scrollTop: {
        users: validScrollTop(parsed.scrollTop?.users),
        chats: validScrollTop(parsed.scrollTop?.chats),
      },
    };
  } catch {
    return DEFAULT_DASHBOARD_STATE;
  }
}

function writeDashboardState(state: DashboardState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify(state));
  } catch {
    // 저장 공간을 쓸 수 없어도 조회 기능 자체는 계속 동작해야 한다.
  }
}

function clearDashboardState() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DASHBOARD_STATE_KEY);
  } catch {
    // 저장 공간을 쓸 수 없어도 로그아웃은 계속 진행한다.
  }
}

function validScrollTop(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}
