import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdminMissionsResponseShapeError,
  normalizeAdminMissionsResponse,
} from "./adminMissionsResponse";

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

test("빈 배열은 매칭이 없는 정상 상태로 처리한다", () => {
  assert.deepEqual(normalizeAdminMissionsResponse([]), { items: [], excluded: [] });
});

test("{items, excluded} 객체가 오면 그대로 나눠 돌려준다", () => {
  const excluded = [{ matchId: 2, reason: "NO_TEMPLATE" }];
  const result = normalizeAdminMissionsResponse({ items: [item], excluded });

  assert.deepEqual(result, { items: [item], excluded });
});

test("excluded 없이 items만 온 객체도 처리한다", () => {
  const result = normalizeAdminMissionsResponse({ items: [item] });

  assert.deepEqual(result, { items: [item], excluded: [] });
});

test("items가 배열이 아니면 계약이 깨진 것으로 보고 던진다(빈 목록으로 감추지 않는다)", () => {
  assert.throws(
    () => normalizeAdminMissionsResponse({ items: "broken", excluded: [] }),
    AdminMissionsResponseShapeError,
  );
});

test("excluded가 배열이 아니면 던진다(제외 알림이 조용히 사라지지 않게)", () => {
  assert.throws(
    () => normalizeAdminMissionsResponse({ items: [item], excluded: "broken" }),
    AdminMissionsResponseShapeError,
  );
});

test("null·undefined·알 수 없는 형태의 객체는 던진다", () => {
  assert.throws(() => normalizeAdminMissionsResponse(null), AdminMissionsResponseShapeError);
  assert.throws(() => normalizeAdminMissionsResponse(undefined), AdminMissionsResponseShapeError);
  assert.throws(
    () => normalizeAdminMissionsResponse({ data: [item] }),
    AdminMissionsResponseShapeError,
  );
});
