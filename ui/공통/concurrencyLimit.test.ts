import assert from "node:assert/strict";
import { test } from "node:test";
import { createConcurrencyGate } from "./concurrencyLimit";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/** 마이크로태스크 큐를 비운다 — `run`은 fn 재개→반환값 처리→finally까지 여러 홉을 거치므로
 *  `await Promise.resolve()` 한두 번으로는 부족하다. */
function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

test("동시에 최대 limit개까지만 실행한다", async () => {
  const gate = createConcurrencyGate(2);
  let active = 0;
  let maxActive = 0;
  const gates = [0, 1, 2, 3, 4].map(() => deferred<void>());

  const results = [0, 1, 2, 3, 4].map((index) =>
    gate.run(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await gates[index]!.promise;
      active -= 1;
      return index * 10;
    }),
  );

  await flushMicrotasks();
  assert.equal(active, 2, "limit=2면 동시에 둘만 진행 중이어야 한다");

  gates[0]!.resolve();
  gates[1]!.resolve();
  await flushMicrotasks();
  assert.equal(active, 2, "먼저 둘이 끝나도 다음 둘이 바로 채워져 여전히 둘이어야 한다");

  gates[2]!.resolve();
  gates[3]!.resolve();
  gates[4]!.resolve();
  const resolved = await Promise.all(results);

  assert.deepEqual(resolved, [0, 10, 20, 30, 40]);
  assert.equal(maxActive, 2);
});

test("게이트를 공유하는 여러 배치가 겹쳐도 합쳐서 limit을 넘지 않는다", async () => {
  // 관리자 화면에서 겪은 실제 회귀: 목록을 다시 불러와 이름 조회가 두 번 겹치면,
  // 호출 하나만 5개로 제한해도 실제로는 최대 10개가 동시에 나갔다.
  const gate = createConcurrencyGate(3);
  let active = 0;
  let maxActive = 0;
  const gates = [0, 1, 2, 3, 4, 5].map(() => deferred<void>());

  function runBatch(indices: number[]) {
    return Promise.all(
      indices.map((index) =>
        gate.run(async () => {
          active += 1;
          maxActive = Math.max(maxActive, active);
          await gates[index]!.promise;
          active -= 1;
        }),
      ),
    );
  }

  const firstBatch = runBatch([0, 1, 2]);
  const secondBatch = runBatch([3, 4, 5]);

  await flushMicrotasks();
  assert.equal(active, 3, "두 배치가 겹쳐도 합쳐서 limit(3)을 넘지 않아야 한다");

  gates.forEach((g) => g.resolve());
  await Promise.all([firstBatch, secondBatch]);

  assert.equal(maxActive, 3);
});

test("실행한 함수의 결과와 오류를 그대로 돌려준다", async () => {
  const gate = createConcurrencyGate(2);

  await assert.doesNotReject(gate.run(async () => "ok"));
  assert.equal(await gate.run(async () => "value"), "value");
  await assert.rejects(
    gate.run(async () => {
      throw new Error("boom");
    }),
    /boom/,
  );

  // 하나가 실패해도 게이트 자체는 계속 다른 작업을 받는다.
  assert.equal(await gate.run(async () => "after-error"), "after-error");
});

test("limit이 0 이하이면 최소 1개씩은 진행한다", async () => {
  const gate = createConcurrencyGate(0);
  let active = 0;
  let maxActive = 0;
  const gates = [0, 1].map(() => deferred<void>());

  const results = [0, 1].map((index) =>
    gate.run(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await gates[index]!.promise;
      active -= 1;
      return index;
    }),
  );

  await flushMicrotasks();
  assert.equal(active, 1);

  gates.forEach((g) => g.resolve());
  await Promise.all(results);

  assert.equal(maxActive, 1);
});
