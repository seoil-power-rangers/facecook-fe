import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { resolveSessionSeed } from "./sessionSeed";

// Node의 내장 sessionStorage로 실제 저장·재사용 경로를 검증한다(Web Storage는 메서드를
// 일반 프로퍼티 할당으로 오버라이드할 수 없는 legacy platform object라, 저장이 막힌
// 상황의 폴백 경로는 여기서 흉내 낼 수 없다 — 그 경로는 시크릿 모드 등 실제 브라우저에서
// 확인한다).
const SEED_KEY = "facecook:explore:seed";

beforeEach(() => {
  sessionStorage.clear();
});

test("처음 호출하면 새 시드를 만들어 저장하고 그 값을 돌려준다", () => {
  const seed = resolveSessionSeed(0);

  assert.equal(sessionStorage.getItem(SEED_KEY), String(seed));
});

test("이미 저장된 값이 있으면 fallbackSeed와 무관하게 그 값을 그대로 쓴다", () => {
  const first = resolveSessionSeed(0);

  const second = resolveSessionSeed(999);

  assert.equal(second, first);
});
