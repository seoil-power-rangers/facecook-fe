import assert from "node:assert/strict";
import { test } from "node:test";
import { createSharedRequest } from "./sharedRequestCore";

/** 응답 시점을 테스트가 직접 정하는 요청. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(maxAgeMs = 30_000) {
  const requests: ReturnType<typeof deferred<string>>[] = [];
  let clock = 0;
  const shared = createSharedRequest<string>({
    fetch: () => {
      const request = deferred<string>();
      requests.push(request);
      return request.promise;
    },
    maxAgeMs,
    now: () => clock,
  });
  return {
    shared,
    requests,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

test("같은 순간에 여러 곳이 불러도 요청은 하나이고 모두 같은 값을 받는다", async () => {
  const { shared, requests } = setup();

  const a = shared.get();
  const b = shared.get();
  requests[0].resolve("내 프로필");

  assert.equal(requests.length, 1);
  assert.deepEqual(await Promise.all([a, b]), ["내 프로필", "내 프로필"]);
});

test("보관 시간 안에는 다시 요청하지 않고, 지나면 새로 요청한다", async () => {
  const { shared, requests, advance } = setup(30_000);

  const first = shared.get();
  requests[0].resolve("처음 값");
  await first;

  advance(29_999);
  assert.equal(await shared.get(), "처음 값");
  assert.equal(requests.length, 1);

  advance(1);
  const next = shared.get();
  assert.equal(requests.length, 2);
  requests[1].resolve("새 값");
  assert.equal(await next, "새 값");
});

test("실패는 기다리던 곳 모두에게 전달되고 보관되지 않아 다음에 새로 요청한다", async () => {
  const { shared, requests } = setup();

  const a = shared.get();
  const b = shared.get();
  requests[0].reject(new Error("네트워크"));

  await assert.rejects(a, /네트워크/);
  await assert.rejects(b, /네트워크/);

  const retry = shared.get();
  assert.equal(requests.length, 2);
  requests[1].resolve("다시 받은 값");
  assert.equal(await retry, "다시 받은 값");
});

test("수정 응답으로 바꾼 값은 그 전에 시작한 요청의 응답이 덮지 못한다", async () => {
  const { shared, requests } = setup();

  const before = shared.get();
  shared.set("수정 뒤 값");
  requests[0].resolve("수정 전 응답");

  assert.equal(await before, "수정 전 응답");
  assert.equal(await shared.get(), "수정 뒤 값");
  assert.equal(requests.length, 1);
});

test("비운 뒤에는 이전 계정의 진행 중 응답을 보관하지 않고 새로 요청한다", async () => {
  const { shared, requests } = setup();

  const oldAccount = shared.get();
  shared.clear();
  requests[0].resolve("이전 계정");
  await oldAccount;

  const newAccount = shared.get();
  assert.equal(requests.length, 2);
  requests[1].resolve("새 계정");
  assert.equal(await newAccount, "새 계정");
});
