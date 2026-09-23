import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { resolveSessionSeed } from "./sessionSeed";

// `sessionStorage`는 브라우저 전용 전역이고, Node에서의 가용성은 버전마다 다르다(로컬 Node
// 26은 기본 제공하지만 CI의 Node 22는 없다 — 실제로 CI에서 `sessionStorage is not defined`로
// 떨어진 걸 보고 알았다). 테스트를 어느 Node 버전에서도 같게 만들기 위해 최소 기능의
// 메모리 스토리지를 직접 준비해서 전역에 채운다. Web Storage는 메서드를 일반 프로퍼티
// 할당으로 오버라이드할 수 없는 legacy platform object라, 저장이 막힌 상황의 폴백 경로는
// 여기서 흉내 낼 수 없다 — 그 경로는 시크릿 모드 등 실제 브라우저에서 확인한다.
class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  clear(): void {
    this.store.clear();
  }
}

const testStorage = new MemoryStorage();
(globalThis as { sessionStorage?: unknown }).sessionStorage = testStorage;

const SEED_KEY = "facecook:explore:seed";

beforeEach(() => {
  testStorage.clear();
});

test("처음 호출하면 새 시드를 만들어 저장하고 그 값을 돌려준다", () => {
  const seed = resolveSessionSeed(0);

  assert.equal(testStorage.getItem(SEED_KEY), String(seed));
});

test("이미 저장된 값이 있으면 fallbackSeed와 무관하게 그 값을 그대로 쓴다", () => {
  const first = resolveSessionSeed(0);

  const second = resolveSessionSeed(999);

  assert.equal(second, first);
});
