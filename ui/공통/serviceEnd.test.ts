import assert from "node:assert/strict";
import { test } from "node:test";
import { isServiceEnded, nextCheckDelayMs, serviceEndStatus } from "./serviceEnd";

const END_AT = "2026-10-03T00:00:00+09:00";

test("종료 시각 전에는 종료되지 않는다", () => {
  assert.equal(isServiceEnded(END_AT, Date.UTC(2026, 9, 2, 14, 59, 59)), false);
});

test("종료 시각 정각부터 종료된다", () => {
  assert.equal(isServiceEnded(END_AT, Date.UTC(2026, 9, 2, 15, 0, 0)), true);
});

test("종료 시각이 없으면 종료하지 않는다", () => {
  assert.equal(isServiceEnded(undefined, Date.UTC(2030, 0, 1)), false);
  assert.equal(isServiceEnded("", Date.UTC(2030, 0, 1)), false);
});

test("읽을 수 없는 값이면 종료하지 않는다", () => {
  assert.equal(isServiceEnded("10/3 자정", Date.UTC(2030, 0, 1)), false);
});

test("서버는 종료 시각까지 남은 시간을 함께 알려 준다", () => {
  assert.deepEqual(serviceEndStatus(END_AT, Date.UTC(2026, 9, 2, 14, 50, 0)), { ended: false, remainingMs: 10 * 60_000 });
  assert.deepEqual(serviceEndStatus(END_AT, Date.UTC(2026, 9, 2, 15, 0, 5)), { ended: true, remainingMs: 0 });
  assert.deepEqual(serviceEndStatus(undefined, Date.UTC(2026, 9, 2)), { ended: false, remainingMs: null });
});

test("종료가 2분보다 멀면 2분 전에 다시 묻되 10분을 넘겨 기다리지 않는다", () => {
  assert.equal(nextCheckDelayMs(5 * 60_000), 3 * 60_000);
  assert.equal(nextCheckDelayMs(3 * 60 * 60_000), 10 * 60_000);
});

test("종료 2분 안이면 종료 1초 뒤에 묻되 30초를 넘겨 기다리지 않는다", () => {
  assert.equal(nextCheckDelayMs(10_000), 11_000);
  assert.equal(nextCheckDelayMs(2 * 60_000), 30_000);
  assert.equal(nextCheckDelayMs(0), 1_000);
});
