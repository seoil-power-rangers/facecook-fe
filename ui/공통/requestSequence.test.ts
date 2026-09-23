import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequestSequence } from "./requestSequence";

test("가장 최근에 시작한 요청만 최신이다", () => {
  const sequence = createRequestSequence();

  const first = sequence.begin();
  assert.equal(sequence.isLatest(first), true);

  const second = sequence.begin();
  assert.equal(sequence.isLatest(first), false);
  assert.equal(sequence.isLatest(second), true);
});

test("무효화하면 진행 중이던 요청은 모두 최신이 아니고 새 요청은 다시 최신이 된다", () => {
  const sequence = createRequestSequence();
  const inFlight = sequence.begin();

  sequence.invalidate();
  assert.equal(sequence.isLatest(inFlight), false);

  const next = sequence.begin();
  assert.equal(sequence.isLatest(next), true);
  assert.equal(sequence.isLatest(inFlight), false);
});

// 관리자 화면의 이름 조회처럼 "덮어쓰지 않고 병합"하는 값도, isLatest로 감싸지 않으면
// 먼저 시작했지만 늦게 끝난 요청이(예: 일시적 실패로 인한 폴백 값) 나중에 시작해
// 먼저 끝난 요청의 정상 값을 덮어쓴다. 실제로 AdminMissionScreen/AdminReportScreen의
// 이름 조회에서 겪은 회귀라 여기 고정해 둔다.
test("먼저 시작했지만 늦게 끝난 병합은 나중에 시작해 먼저 끝난 결과를 덮어쓰지 않는다", async () => {
  const sequence = createRequestSequence();
  let names: Record<number, string> = {};

  function fetchNames(resultsById: Record<number, string>, delayMs: number) {
    const requestId = sequence.begin();
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (sequence.isLatest(requestId)) {
          names = { ...names, ...resultsById };
        }
        resolve();
      }, delayMs);
    });
  }

  const staleFallback = fetchNames({ 1: "참가자 #1" }, 30); // 먼저 시작, 느리게 끝남(폴백 값)
  const freshResult = fetchNames({ 1: "정상이름" }, 5); // 나중에 시작, 먼저 끝남(정상 값)

  await Promise.all([staleFallback, freshResult]);

  assert.deepEqual(names, { 1: "정상이름" });
});
