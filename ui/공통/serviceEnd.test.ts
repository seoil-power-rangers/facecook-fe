import assert from "node:assert/strict";
import { test } from "node:test";
import { isServiceEnded } from "./serviceEnd";

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
