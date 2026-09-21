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
