import Link from "next/link";
import { MessageCircleOff } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { TabBar } from "@ui/공통/TabBar";
import { matchRooms } from "./matches.mock";

export function MatchListScreen() {
  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center justify-center border-b border-(--color-border) bg-(--color-surface) px-4">
        <h1 className="text-lg font-bold text-(--color-text-strong)">매칭</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        {matchRooms.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-6 pt-24 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-disabled-bg) text-(--color-text-muted)">
              <MessageCircleOff className="h-6 w-6" />
            </span>
            <p className="text-sm font-bold text-(--color-text-strong)">채팅이 아직 없어요</p>
            <p className="text-xs text-(--color-text-sub)">서로 콕하면 매칭되고, 그때부터 대화할 수 있어요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-4">
            {matchRooms.map((room) => (
              <Link
                key={room.id}
                href={`/match/${room.id}`}
                className={`flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 ${
                  room.status === "suspended" ? "opacity-60" : ""
                }`}
              >
                <Avatar
                  name={room.name}
                  size="lg"
                  bgColor={room.bgColor}
                  suspended={room.status === "suspended"}
                />
                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-(--color-text-strong)">
                      {room.name}
                    </span>
                    <span className="shrink-0 text-xs text-(--color-text-muted)">{room.lastMessageAt}</span>
                  </div>
                  <span className="truncate text-xs text-(--color-text-sub)">{room.lastMessage}</span>
                </div>
                {room.unreadCount ? (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-(--color-danger) px-1.5 text-[11px] font-semibold text-(--color-text-on-primary)">
                    {room.unreadCount}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </main>

      <TabBar />
    </PhoneFrame>
  );
}
