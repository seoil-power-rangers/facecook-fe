import assert from "node:assert/strict";
import { test } from "node:test";
import { createLatestOnlyFetcher } from "./liveBadgesCore";

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

/** Promise 콜백이 모두 실행되게 한다. */
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

function setup(staleAfterMs = 15_000) {
  const requests: ReturnType<typeof deferred<string>>[] = [];
  const values: string[] = [];
  const errors: unknown[] = [];
  let clock = 0;
  const fetcher = createLatestOnlyFetcher<string>({
    fetch: () => {
      const request = deferred<string>();
      requests.push(request);
      return request.promise;
    },
    onValue: (value) => values.push(value),
    onError: (error) => errors.push(error),
    staleAfterMs,
    now: () => clock,
  });
  return {
    fetcher,
    requests,
    values,
    errors,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

test("강제 갱신 뒤에 도착한 이전 요청의 응답은 최신 응답을 덮지 못한다", async () => {
  const { fetcher, requests, values } = setup();

  fetcher.poll();
  fetcher.force();
  requests[1].resolve("변경 뒤 응답");
  await flush();
  requests[0].resolve("변경 전 응답");
  await flush();

  assert.deepEqual(values, ["변경 뒤 응답"]);
});

test("이전 요청이 먼저 끝나도 무효화됐다면 반영하지 않는다", async () => {
  const { fetcher, requests, values } = setup();

  fetcher.poll();
  fetcher.force();
  requests[0].resolve("변경 전 응답");
  await flush();

  assert.deepEqual(values, []);

  requests[1].resolve("변경 뒤 응답");
  await flush();
  assert.deepEqual(values, ["변경 뒤 응답"]);
});

test("응답이 폴링 주기보다 늦어도 요청을 쌓지 않고 그 응답이 반영된다", async () => {
  const { fetcher, requests, values, advance } = setup();

  fetcher.poll();
  advance(5_000);
  fetcher.poll();
  assert.equal(requests.length, 1, "진행 중이면 다음 폴링은 새로 보내지 않는다");

  advance(1_000);
  requests[0].resolve("느린 응답");
  await flush();
  assert.deepEqual(values, ["느린 응답"]);

  advance(4_000);
  fetcher.poll();
  assert.equal(requests.length, 2, "응답이 끝난 뒤의 폴링은 새 요청을 보낸다");
});

test("지연이 항상 폴링 주기보다 길어도 성공 응답이 계속 폐기되지 않는다", async () => {
  const { fetcher, requests, values, advance } = setup();

  for (let round = 0; round < 3; round++) {
    fetcher.poll();
    advance(5_000);
    fetcher.poll();
    advance(2_000);
    requests[round].resolve(`응답 ${round}`);
    await flush();
    advance(3_000);
  }

  assert.deepEqual(values, ["응답 0", "응답 1", "응답 2"]);
});

test("멈춘 것으로 보이는 요청은 새로 시작하고 늦게 온 이전 응답은 버린다", async () => {
  const { fetcher, requests, values, advance } = setup(15_000);

  fetcher.poll();
  advance(14_999);
  fetcher.poll();
  assert.equal(requests.length, 1);

  advance(1);
  fetcher.poll();
  assert.equal(requests.length, 2, "기준 시간을 넘기면 새 요청을 시작한다");

  requests[1].resolve("새 응답");
  await flush();
  requests[0].resolve("늦게 온 옛 응답");
  await flush();

  assert.deepEqual(values, ["새 응답"]);
});

test("무효화하면 진행 중인 응답을 버리고 다음 폴링은 새 요청을 보낸다", async () => {
  const { fetcher, requests, values } = setup();

  fetcher.poll();
  fetcher.invalidate();
  requests[0].resolve("이전 계정의 응답");
  await flush();
  assert.deepEqual(values, []);

  fetcher.poll();
  assert.equal(requests.length, 2);
});

test("무효화된 요청의 실패는 오류로 보고되지 않고 최신 요청의 진행 상태를 지우지 않는다", async () => {
  const { fetcher, requests, errors } = setup();

  fetcher.poll();
  fetcher.force();
  requests[0].reject(new Error("옛 요청 실패"));
  await flush();
  assert.deepEqual(errors, []);

  fetcher.poll();
  assert.equal(requests.length, 2, "최신 요청이 아직 진행 중이라 폴링은 새로 보내지 않는다");
});

test("최신 요청의 실패는 보고하고 다음 폴링이 다시 시도한다", async () => {
  const { fetcher, requests, errors } = setup();

  fetcher.poll();
  const failure = new Error("네트워크 오류");
  requests[0].reject(failure);
  await flush();
  assert.deepEqual(errors, [failure]);

  fetcher.poll();
  assert.equal(requests.length, 2);
});

test("fetch가 동기 예외를 던져도 오류로 보고하고 진행 상태를 남기지 않는다", async () => {
  const errors: unknown[] = [];
  let calls = 0;
  const fetcher = createLatestOnlyFetcher<string>({
    fetch: () => {
      calls += 1;
      throw new Error("즉시 실패");
    },
    onValue: () => {},
    onError: (error) => errors.push(error),
    staleAfterMs: 15_000,
    now: () => 0,
  });

  fetcher.poll();
  await flush();
  fetcher.poll();

  assert.equal(errors.length, 1);
  assert.equal(calls, 2);
});
