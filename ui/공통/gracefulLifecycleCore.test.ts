import assert from "node:assert/strict";
import { test } from "node:test";
import { createGracefulLifecycle } from "./gracefulLifecycleCore";

/** 테스트가 시간을 직접 흘리는 타이머. */
function fakeTimers() {
  let now = 0;
  let nextId = 1;
  const timers = new Map<number, { at: number; callback: () => void }>();
  return {
    setTimer: (callback: () => void, ms: number) => {
      const id = nextId++;
      timers.set(id, { at: now + ms, callback });
      return id;
    },
    clearTimer: (id: unknown) => {
      timers.delete(id as number);
    },
    advance: (ms: number) => {
      now += ms;
      for (const [id, timer] of [...timers]) {
        if (timer.at <= now) {
          timers.delete(id);
          timer.callback();
        }
      }
    },
  };
}

function setup(graceMs = 5_000) {
  const calls: string[] = [];
  const timers = fakeTimers();
  const lifecycle = createGracefulLifecycle({
    start: () => calls.push("start"),
    stop: () => calls.push("stop"),
    graceMs,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
  });
  return { lifecycle, calls, advance: timers.advance };
}

test("첫 구독에서 한 번만 시작하고, 구독이 여럿이어도 다시 시작하지 않는다", () => {
  const { lifecycle, calls } = setup();

  lifecycle.acquire();
  lifecycle.acquire();

  assert.deepEqual(calls, ["start"]);
});

test("탭을 옮기듯 구독이 끝나자마자 다시 생기면 멈추지도 다시 시작하지도 않는다", () => {
  const { lifecycle, calls, advance } = setup(5_000);

  const oldScreen = lifecycle.acquire();
  oldScreen();
  lifecycle.acquire();
  advance(10_000);

  assert.deepEqual(calls, ["start"]);
});

test("기다리는 시간 안에 다시 구독하면 이어 쓰고, 지나도록 아무도 없으면 그때 멈춘다", () => {
  const { lifecycle, calls, advance } = setup(5_000);

  const first = lifecycle.acquire();
  first();
  advance(4_999);
  const second = lifecycle.acquire();
  advance(5_000);
  assert.deepEqual(calls, ["start"]);

  second();
  advance(4_999);
  assert.deepEqual(calls, ["start"]);
  advance(1);
  assert.deepEqual(calls, ["start", "stop"]);
});

test("멈춘 뒤 다시 구독하면 새로 시작한다", () => {
  const { lifecycle, calls, advance } = setup(5_000);

  lifecycle.acquire()();
  advance(5_000);
  lifecycle.acquire();

  assert.deepEqual(calls, ["start", "stop", "start"]);
});

test("같은 구독을 두 번 끝내도 한 번만 센다", () => {
  const { lifecycle, calls, advance } = setup(5_000);

  const a = lifecycle.acquire();
  lifecycle.acquire();
  a();
  a();
  advance(10_000);

  assert.deepEqual(calls, ["start"]);
});
