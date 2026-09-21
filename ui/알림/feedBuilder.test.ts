import assert from "node:assert/strict";
import { test } from "node:test";
import { buildFeedFromData, type FeedCook, type FeedMatch } from "./feedBuilder";

const ME = 1;

function cook(cookId: number, status: string, sentAt: string): FeedCook {
  return { cookId, status, sentAt, profile: { nickname: `상대${cookId}` } };
}

test("대기 중인 받은 콕은 맞콕 안내와 함께 알림이 된다", () => {
  const feed = buildFeedFromData({ received: [cook(10, "pending", "2026-09-30T03:00:00Z")] }, [], ME);

  assert.equal(feed.length, 1);
  assert.equal(feed[0].id, "cook-10");
  assert.equal(feed[0].body, "맞콕하면 바로 매칭돼요");
  assert.equal(feed[0].href, "/kok");
});

test("매칭으로 이어진 받은 콕은 그렇게 안내한다", () => {
  const feed = buildFeedFromData({ received: [cook(10, "matched", "2026-09-30T03:00:00Z")] }, [], ME);

  assert.equal(feed[0].body, "매칭으로 이어졌어요");
});

test("만료된 레거시 콕은 맞콕할 수 없으므로 알림에 넣지 않는다", () => {
  const feed = buildFeedFromData({ received: [cook(10, "expired", "2026-09-30T03:00:00Z")] }, [], ME);

  assert.deepEqual(feed, []);
});

test("거절된 콕과 알 수 없는 상태의 콕도 알림에 넣지 않는다", () => {
  const feed = buildFeedFromData(
    { received: [cook(10, "rejected", "2026-09-30T03:00:00Z"), cook(11, "unknown", "2026-09-30T03:01:00Z")] },
    [],
    ME,
  );

  assert.deepEqual(feed, []);
});

test("상대가 보낸 최근 메시지만 알림이 되고 내가 보낸 메시지는 뺀다", () => {
  const matches: FeedMatch[] = [
    {
      matchId: 5,
      matchedAt: "2026-09-30T03:00:00Z",
      partner: { nickname: "민지" },
      recentMessage: { senderId: 2, content: "안녕하세요", sentAt: "2026-09-30T03:10:00Z" },
    },
    {
      matchId: 6,
      matchedAt: "2026-09-30T02:00:00Z",
      partner: { nickname: "하늘" },
      recentMessage: { senderId: ME, content: "내가 보냄", sentAt: "2026-09-30T02:10:00Z" },
    },
  ];

  const feed = buildFeedFromData({ received: [] }, matches, ME);

  assert.deepEqual(
    feed.map((item) => item.id),
    ["message-5-2026-09-30T03:10:00Z", "match-5", "match-6"],
  );
});

test("알림은 최신순으로 정렬된다", () => {
  const feed = buildFeedFromData(
    {
      received: [cook(1, "pending", "2026-09-30T01:00:00Z"), cook(2, "pending", "2026-09-30T05:00:00Z")],
    },
    [],
    ME,
  );

  assert.deepEqual(
    feed.map((item) => item.id),
    ["cook-2", "cook-1"],
  );
});
