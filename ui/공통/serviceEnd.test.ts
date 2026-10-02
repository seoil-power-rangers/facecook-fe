import assert from "node:assert/strict";
import { test } from "node:test";
import { isServiceEnded, watchDelayMs } from "./serviceEnd";

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

test("종료 시각 2분 전까지 기다렸다가 서버에 묻기 시작한다", () => {
  const endAtMs = Date.UTC(2026, 9, 2, 13, 0, 0);
  assert.equal(watchDelayMs(endAtMs, endAtMs - 10 * 60_000), 8 * 60_000);
  assert.equal(watchDelayMs(endAtMs, endAtMs - 60_000), 0);
  assert.equal(watchDelayMs(endAtMs, endAtMs + 60_000), 0);
});

test("기다릴 시간이 setTimeout 한도를 넘으면 한도까지만 기다린다", () => {
  assert.equal(watchDelayMs(Date.UTC(2030, 0, 1), Date.UTC(2026, 9, 2)), 2_147_483_647);
});
