import assert from "node:assert/strict";
import { test } from "node:test";
import { endsTimeGroup } from "./messageGroup";

const at = (senderId: number, sentAt: string) => ({ senderId, sentAt });

test("마지막 메시지는 시각을 붙인다", () => {
  assert.equal(endsTimeGroup(at(1, "2026-09-29T05:32:10Z"), undefined), true);
});

test("같은 사람이 같은 분에 이어 보내면 앞의 것은 시각을 뗀다", () => {
  assert.equal(
    endsTimeGroup(at(1, "2026-09-29T05:32:10Z"), at(1, "2026-09-29T05:32:50Z")),
    false,
  );
});

test("분이 바뀌면 시각을 붙인다", () => {
  assert.equal(
    endsTimeGroup(at(1, "2026-09-29T05:32:59Z"), at(1, "2026-09-29T05:33:01Z")),
    true,
  );
});

test("보낸 사람이 바뀌면 같은 분이어도 시각을 붙인다", () => {
  assert.equal(
    endsTimeGroup(at(1, "2026-09-29T05:32:10Z"), at(2, "2026-09-29T05:32:20Z")),
    true,
  );
});

test("날짜가 바뀌면 시각을 붙인다", () => {
  assert.equal(
    endsTimeGroup(at(1, "2026-09-29T14:59:00Z"), at(1, "2026-09-30T14:59:00Z")),
    true,
  );
});

test("시각을 읽을 수 없으면 묶지 않는다", () => {
  assert.equal(endsTimeGroup(at(1, "이상한 값"), at(1, "2026-09-29T05:32:10Z")), true);
  assert.equal(endsTimeGroup(at(1, "2026-09-29T05:32:10Z"), at(1, "이상한 값")), true);
});

test("서버의 오프셋 없는 시각과 방금 보낸 메시지의 Z 시각을 같은 기준으로 읽는다", () => {
  // 서버는 KST를 오프셋 없이 보낸다. 같은 순간을 UTC로 쓰면 09:32Z다.
  const fromServer = at(1, "2026-09-29T18:32:10");
  const justSent = at(1, "2026-09-29T09:32:40Z");

  assert.equal(endsTimeGroup(fromServer, justSent), false);
});
