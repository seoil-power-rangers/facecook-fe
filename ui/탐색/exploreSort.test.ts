import assert from "node:assert/strict";
import { test } from "node:test";
import { sortMembersForSession, type SortableMember } from "./exploreSort";

function member(userId: number, isActive: boolean): SortableMember {
  return { userId, isActive };
}

test("활동 중인 사람이 항상 비활동 사람보다 앞이다", () => {
  const members = [member(1, false), member(2, true), member(3, false), member(4, true)];

  const sorted = sortMembersForSession(members, 42);

  const activeCount = members.filter((m) => m.isActive).length;
  assert.ok(sorted.slice(0, activeCount).every((m) => m.isActive));
  assert.ok(sorted.slice(activeCount).every((m) => !m.isActive));
});

test("같은 시드로 여러 번 정렬해도 항상 같은 순서다", () => {
  const members = [member(5, false), member(1, true), member(3, true), member(2, false)];

  const first = sortMembersForSession(members, 7);
  const second = sortMembersForSession(members, 7);

  assert.deepEqual(
    first.map((m) => m.userId),
    second.map((m) => m.userId),
  );
});

test("시드가 다르면(같은 활동군 안에서) 순서가 달라질 수 있다", () => {
  const members = [member(1, true), member(2, true), member(3, true), member(4, true), member(5, true)];

  const bySeedA = sortMembersForSession(members, 1).map((m) => m.userId);
  const bySeedB = sortMembersForSession(members, 999).map((m) => m.userId);

  assert.notDeepEqual(bySeedA, bySeedB);
});

test("원본 배열을 바꾸지 않는다", () => {
  const members = [member(2, false), member(1, true)];
  const original = [...members];

  sortMembersForSession(members, 3);

  assert.deepEqual(members, original);
});
