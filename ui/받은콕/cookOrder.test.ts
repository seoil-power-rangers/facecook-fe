import assert from "node:assert/strict";
import { test } from "node:test";
import { sortReceivedCooks } from "./cookOrder";

const cook = (id: number, status: "pending" | "matched" | "rejected" | "expired") => ({
  id,
  status,
});

test("맞콕할 수 있는 콕을 맨 위로 올린다", () => {
  const sorted = sortReceivedCooks([
    cook(1, "matched"),
    cook(2, "rejected"),
    cook(3, "pending"),
  ]);

  assert.deepEqual(
    sorted.map((item) => item.id),
    [3, 1, 2],
  );
});

test("맞콕할 수 있는 것끼리는 서버가 준 순서를 지킨다", () => {
  const sorted = sortReceivedCooks([
    cook(5, "pending"),
    cook(8, "matched"),
    cook(2, "pending"),
  ]);

  assert.deepEqual(
    sorted.map((item) => item.id),
    [5, 2, 8],
  );
});

test("나머지끼리도 서버가 준 순서를 지킨다", () => {
  const sorted = sortReceivedCooks([
    cook(9, "matched"),
    cook(1, "pending"),
    cook(4, "rejected"),
    cook(7, "matched"),
  ]);

  assert.deepEqual(
    sorted.map((item) => item.id),
    [1, 9, 4, 7],
  );
});

test("원본 배열을 바꾸지 않는다", () => {
  const cooks = [cook(1, "matched"), cook(2, "pending")];
  sortReceivedCooks(cooks);

  assert.deepEqual(
    cooks.map((item) => item.id),
    [1, 2],
  );
});
