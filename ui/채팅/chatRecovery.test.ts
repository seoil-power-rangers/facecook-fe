import assert from "node:assert/strict";
import { test } from "node:test";
import { reconcileHistory } from "./chatRecovery";

interface StubMessage {
  messageId: number;
}

function page(ids: number[]): StubMessage[] {
  return ids.map((messageId) => ({ messageId }));
}

test("첫 페이지가 페이지 크기보다 작으면 한 번만 조회하고 멈춘다", async () => {
  const calls: (number | undefined)[] = [];
  const result = await reconcileHistory({
    fetchPage: async (before) => {
      calls.push(before);
      return page([48, 49, 50]);
    },
    oldestLoadedId: null,
    pageSize: 50,
  });

  assert.deepEqual(calls, [undefined]);
  assert.deepEqual(result.map((m) => m.messageId), [48, 49, 50]);
});

test("최신 페이지가 이미 로딩된 가장 오래된 메시지에 닿으면 멈춘다", async () => {
  // 100까지는 이미 로컬에 있다고 가정. 최신 페이지(101~150)는 경계(100)보다 크므로
  // 한 번 더 내려가서(51~100) pageOldestId(51)가 경계(100) 밑으로 닿을 때 멈춘다.
  const pagesByCursor: Record<string, StubMessage[]> = {
    undefined: page(Array.from({ length: 50 }, (_, i) => 101 + i)), // 101~150
    "101": page(Array.from({ length: 50 }, (_, i) => 51 + i)), // 51~100
  };
  const calls: (number | undefined)[] = [];
  const result = await reconcileHistory({
    fetchPage: async (before) => {
      calls.push(before);
      return pagesByCursor[String(before)] ?? [];
    },
    oldestLoadedId: 100,
    pageSize: 50,
  });

  assert.deepEqual(calls, [undefined, 101]);
  assert.deepEqual(
    result.map((m) => m.messageId),
    [...Array.from({ length: 50 }, (_, i) => 101 + i), ...Array.from({ length: 50 }, (_, i) => 51 + i)],
  );
});

test("101만 누락된 채 102~151을 실시간으로 이미 받았어도 이어지는 페이지에서 101을 찾는다", async () => {
  // 로컬 최신 상태: 100까지 로딩됐고(oldestLoadedId=100), 102~151은 실시간으로 이미
  // 받아서 화면에 있지만 101만 빠져 있다. 최신 페이지(102~151)만 봐서는 101을 못 찾고,
  // 그 앞 페이지(52~101)까지 내려가야 101이 걸린다.
  const pagesByCursor: Record<string, StubMessage[]> = {
    undefined: page(Array.from({ length: 50 }, (_, i) => 102 + i)), // 102~151
    "102": page(Array.from({ length: 50 }, (_, i) => 52 + i)), // 52~101
  };
  const calls: (number | undefined)[] = [];

  const result = await reconcileHistory({
    fetchPage: async (before) => {
      calls.push(before);
      return pagesByCursor[String(before)] ?? [];
    },
    oldestLoadedId: 100,
    pageSize: 50,
  });

  assert.deepEqual(calls, [undefined, 102]);
  assert.ok(result.some((m) => m.messageId === 101), "101을 찾지 못했다");
});

test("대화 시작까지 내려가면(페이지가 꽉 차지 않으면) 경계와 무관하게 멈춘다", async () => {
  const calls: (number | undefined)[] = [];
  let call = 0;
  const result = await reconcileHistory({
    fetchPage: async (before) => {
      calls.push(before);
      call += 1;
      if (call === 1) return page(Array.from({ length: 50 }, (_, i) => 51 + i)); // 51~100
      return page([1, 2, 3]); // 대화 맨 앞, 페이지 미달
    },
    oldestLoadedId: null,
    pageSize: 50,
  });

  assert.equal(calls.length, 2);
  assert.deepEqual(result.map((m) => m.messageId).slice(-3), [1, 2, 3]);
});

test("최대 페이지 수를 넘기지 않는다", async () => {
  let calls = 0;
  await reconcileHistory({
    fetchPage: async () => {
      calls += 1;
      return page([calls]); // 항상 꽉 찬 것처럼 보이게 pageSize=1로 맞춘다
    },
    oldestLoadedId: null,
    pageSize: 1,
    maxPages: 5,
  });

  assert.equal(calls, 5);
});

test("취소되면 다음 페이지를 요청하지 않고 지금까지 모은 것만 돌려준다", async () => {
  // isCancelled는 매 반복 시작 전, 그리고 페이지를 받은 직후 이렇게 두 번 불린다.
  // 첫 페이지(꽉 찬 페이지라 더 내려가야 함)를 받고 반영한 뒤, 다음 반복 시작
  // 전에야 취소를 감지해 두 번째 fetchPage 호출 없이 멈춰야 한다.
  let calls = 0;
  let checks = 0;
  const result = await reconcileHistory({
    fetchPage: async () => {
      calls += 1;
      return page(Array.from({ length: 50 }, (_, i) => 1000 + i));
    },
    oldestLoadedId: null,
    pageSize: 50,
    isCancelled: () => {
      checks += 1;
      return checks >= 3;
    },
  });

  assert.equal(calls, 1);
  assert.equal(result.length, 50);
});

test("마지막으로 확인한 ID라는 커서를 쓰지 않고 항상 최신 페이지부터 다시 훑는다", async () => {
  // 커밋 순서가 ID 순서와 다를 수 있어(IDENTITY, 개별 저장) "이후"만 보면 뒤늦게
  // 커밋된 작은 ID를 놓친다. 그래서 이 함수는 첫 호출을 항상 커서 없이(최신 페이지)
  // 시작해야 한다 — 호출자가 이전에 확인한 ID를 알고 있어도 넘길 방법이 없다.
  const calls: (number | undefined)[] = [];
  await reconcileHistory({
    fetchPage: async (before) => {
      calls.push(before);
      return page([90, 91, 92]);
    },
    oldestLoadedId: 89,
    pageSize: 50,
  });

  assert.equal(calls[0], undefined);
});
