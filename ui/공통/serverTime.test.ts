import assert from "node:assert/strict";
import { test } from "node:test";
import { formatServerTimeShort, parseServerTime, serverTimeToDate } from "./serverTime";

test("오프셋 없는 서버 시각은 한국 시간으로 해석한다", () => {
  // KST 12:00 = UTC 03:00
  assert.equal(parseServerTime("2026-09-30T12:00:00"), Date.UTC(2026, 8, 30, 3, 0, 0));
});

test("브라우저가 만든 Z 시각(toISOString)은 오프셋을 존중해 그대로 쓴다", () => {
  assert.equal(parseServerTime("2026-09-30T03:00:00.000Z"), Date.UTC(2026, 8, 30, 3, 0, 0));
});

test("이미 +09:00이 붙은 값도 두 번 옮기지 않는다", () => {
  assert.equal(parseServerTime("2026-09-30T12:00:00+09:00"), Date.UTC(2026, 8, 30, 3, 0, 0));
});

test("서버가 나노초까지 보내도 밀리초까지 읽는다", () => {
  assert.equal(parseServerTime("2026-09-30T12:00:00.123456789"), Date.UTC(2026, 8, 30, 3, 0, 0, 123));
});

test("한국 시간 자정 직후는 UTC로는 전날이다(날짜 경계)", () => {
  assert.equal(parseServerTime("2026-10-01T00:30:00"), Date.UTC(2026, 8, 30, 15, 30, 0));
});

test("비었거나 해석할 수 없는 값은 NaN이다", () => {
  assert.ok(Number.isNaN(parseServerTime(null)));
  assert.ok(Number.isNaN(parseServerTime(undefined)));
  assert.ok(Number.isNaN(parseServerTime("")));
  assert.ok(Number.isNaN(parseServerTime("not-a-time")));
  assert.ok(Number.isNaN(serverTimeToDate("not-a-time").getTime()));
});

test("서버 시각끼리 비교해도 순서가 유지된다", () => {
  assert.ok(parseServerTime("2026-09-30T12:00:01") > parseServerTime("2026-09-30T12:00:00"));
});

test("짧은 표시는 서버 문자열(KST)을 그대로 잘라 쓴다", () => {
  assert.equal(formatServerTimeShort("2026-09-30T12:34:56"), "09-30 12:34");
});
