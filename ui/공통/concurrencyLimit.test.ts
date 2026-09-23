import assert from "node:assert/strict";
import { test } from "node:test";
import { mapWithConcurrencyLimit } from "./concurrencyLimit";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

test("동시에 최대 limit개까지만 진행한다", async () => {
  const items = [1, 2, 3, 4, 5];
  let active = 0;
  let maxActive = 0;
  const gates = items.map(() => deferred<void>());

  const resultPromise = mapWithConcurrencyLimit(items, 2, async (item, index) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await gates[index]!.promise;
    active -= 1;
    return item * 10;
  });

  // 이벤트 루프가 워커들을 시작할 시간을 준다.
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(active, 2, "limit=2면 동시에 둘만 진행 중이어야 한다");

  gates[0]!.resolve();
  gates[1]!.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(active, 2, "먼저 둘이 끝나도 다음 둘이 바로 채워져 여전히 둘이어야 한다");

  gates[2]!.resolve();
  gates[3]!.resolve();
  gates[4]!.resolve();
  const result = await resultPromise;

  assert.deepEqual(result, [10, 20, 30, 40, 50]);
  assert.equal(maxActive, 2);
});

test("결과는 완료 순서가 아니라 입력 순서대로 채워진다", async () => {
  const items = ["slow", "fast"];
  const result = await mapWithConcurrencyLimit(items, 2, async (item) => {
    if (item === "slow") {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return item;
  });

  assert.deepEqual(result, ["slow", "fast"]);
});

test("빈 배열은 빈 결과를 바로 돌려준다", async () => {
  const result = await mapWithConcurrencyLimit([], 5, async (item) => item);
  assert.deepEqual(result, []);
});

test("limit이 항목 수보다 크면 전부 동시에 진행한다", async () => {
  const items = [1, 2, 3];
  let active = 0;
  let maxActive = 0;

  await mapWithConcurrencyLimit(items, 10, async (item) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await Promise.resolve();
    active -= 1;
    return item;
  });

  assert.equal(maxActive, 3);
});

test("limit이 0 이하이면 최소 1개씩은 진행한다", async () => {
  const result = await mapWithConcurrencyLimit([1, 2], 0, async (item) => item * 2);
  assert.deepEqual(result, [2, 4]);
});
