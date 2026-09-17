"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellOff, ChevronLeft, Heart, MessageCircle, Users } from "lucide-react";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import {
  buildFeed,
  formatRelative,
  markAllSeen,
  readLastSeen,
  type FeedItem,
  type FeedKind,
} from "./notificationFeed";

const ICONS: Record<FeedKind, typeof Heart> = {
  cook: Heart,
  match: Users,
  message: MessageCircle,
};

const ICON_CLASSES: Record<FeedKind, string> = {
  cook: "bg-(--color-home-kok-bg) text-(--color-home-kok-badge)",
  match: "bg-(--color-home-match-bg) text-(--color-home-match-badge)",
  message: "bg-(--color-primary-light) text-(--color-primary)",
};

export function NotificationScreen() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [lastSeen, setLastSeen] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // 화면에 들어온 시점 기준으로 "새 알림"을 가른다. 목록을 그린 뒤
    // 바로 읽음 처리해서, 다음에 오면 배지가 비어 있다.
    const seenAt = readLastSeen();

    buildFeed()
      .then((feed) => {
        if (!active) return;
        setItems(feed);
        setLastSeen(seenAt);
        markAllSeen();
      })
      .catch(() => {
        if (active) setError("알림을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-1 border-b border-(--color-border) bg-(--color-surface) px-2 pr-4">
        <Link
          href="/main"
          aria-label="홈으로"
          className="flex h-9 w-9 items-center justify-center rounded-full text-(--color-text-strong)"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 text-lg font-bold text-(--color-text-strong)">알림 보관함</h1>
      </header>

      <main className="flex flex-1 flex-col overflow-y-auto p-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-(--color-text-sub)">
            알림을 불러오는 중...
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="py-10 text-center text-sm text-(--color-danger)">
            {error}
          </p>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10">
            <BellOff className="h-9 w-9 text-(--color-text-muted)" aria-hidden="true" />
            <p className="text-sm font-semibold text-(--color-text-strong)">
              아직 알림이 없어요
            </p>
            <p className="text-xs text-(--color-text-sub)">
              콕을 받거나 매칭되면 여기에 쌓여요
            </p>
          </div>
        ) : null}

        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const Icon = ICONS[item.kind];
            const isNew = Date.parse(item.at) > lastSeen;

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex items-start gap-3 rounded-(--radius-lg) border p-3 ${
                    isNew
                      ? "border-(--color-primary-light) bg-(--color-primary-lighter)"
                      : "border-(--color-border) bg-(--color-surface)"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ICON_CLASSES[item.kind]}`}
                  >
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>

                  <span className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-(--color-text-strong)">
                        {item.title}
                      </span>
                      {isNew ? (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-danger)"
                          aria-label="새 알림"
                        />
                      ) : null}
                    </span>
                    {/* 메시지 알림은 본문에 대화 내용이 그대로 들어간다. */}
                    <span
                      data-private
                      className="truncate text-xs text-(--color-text-sub)"
                    >
                      {item.body}
                    </span>
                  </span>

                  <span className="shrink-0 text-[11px] text-(--color-text-muted)">
                    {formatRelative(item.at)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </PhoneFrame>
  );
}
