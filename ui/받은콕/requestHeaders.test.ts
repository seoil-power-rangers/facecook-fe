import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRequestHeaders } from "./requestHeaders";

test("본문이 없어도 호출부가 넘긴 헤더를 유지한다", () => {
  const headers = buildRequestHeaders({ "X-Cook-Reject-Contract": "1" }, false);

  assert.equal(headers.get("X-Cook-Reject-Contract"), "1");
  assert.equal(headers.has("Content-Type"), false);
});

test("본문이 있으면 JSON Content-Type을 채우고 다른 헤더도 유지한다", () => {
  const headers = buildRequestHeaders({ "X-Test": "a" }, true);

  assert.equal(headers.get("Content-Type"), "application/json");
  assert.equal(headers.get("X-Test"), "a");
});

test("호출부가 Content-Type을 정했으면 덮어쓰지 않는다", () => {
  const headers = buildRequestHeaders({ "Content-Type": "text/plain" }, true);

  assert.equal(headers.get("Content-Type"), "text/plain");
});

test("배열과 Headers 형태의 헤더도 받는다", () => {
  assert.equal(buildRequestHeaders([["X-A", "1"]], false).get("X-A"), "1");
  assert.equal(buildRequestHeaders(new Headers({ "X-B": "2" }), false).get("X-B"), "2");
});

test("헤더가 없고 본문도 없으면 빈 헤더를 돌려준다", () => {
  const headers = buildRequestHeaders(undefined, false);

  assert.equal([...headers.keys()].length, 0);
});
