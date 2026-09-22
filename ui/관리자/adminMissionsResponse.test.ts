import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeAdminMissionsResponse } from "./adminMissionsResponse";

const item = {
  matchId: 1,
  userAId: 10,
  userBId: 20,
  matchedAt: "2026-09-22T10:00:00",
  currentStep: 1,
  step1Mission: "a",
  step2Mission: "b",
  step3Mission: "c",
  step1CompletedAt: null,
  step1CompletedBy: null,
  step2CompletedAt: null,
  step2CompletedBy: null,
  step3CompletedAt: null,
  step3CompletedBy: null,
};

test("지금처럼 배열이 오면 그대로 items로 두고 excluded는 빈 배열이다", () => {
  const result = normalizeAdminMissionsResponse([item]);

  assert.deepEqual(result, { items: [item], excluded: [] });
});

test("{items, excluded} 객체가 오면 그대로 나눠 돌려준다", () => {
  const excluded = [{ matchId: 2, reason: "묶음 배정 실패" }];
  const result = normalizeAdminMissionsResponse({ items: [item], excluded });

  assert.deepEqual(result, { items: [item], excluded });
});

test("excluded 없이 items만 온 객체도 처리한다", () => {
  const result = normalizeAdminMissionsResponse({ items: [item] });

  assert.deepEqual(result, { items: [item], excluded: [] });
});

test("items가 배열이 아니면 빈 배열로 취급한다", () => {
  const result = normalizeAdminMissionsResponse({ items: "broken", excluded: null });

  assert.deepEqual(result, { items: [], excluded: [] });
});

test("빈 배열, null, undefined도 던지지 않고 빈 결과를 돌려준다", () => {
  assert.deepEqual(normalizeAdminMissionsResponse([]), { items: [], excluded: [] });
  assert.deepEqual(normalizeAdminMissionsResponse(null), { items: [], excluded: [] });
  assert.deepEqual(normalizeAdminMissionsResponse(undefined), { items: [], excluded: [] });
});
