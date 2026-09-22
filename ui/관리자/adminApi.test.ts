import assert from "node:assert/strict";
import { test } from "node:test";

// requestAdmin은 모듈 최상단에서 process.env.NEXT_PUBLIC_API_BASE_URL을 한 번 읽는다.
// node:test는 이 파일을 별도 프로세스로 실행하므로, import보다 먼저 설정해도 다른
// 테스트 파일에는 영향이 없다.
process.env.NEXT_PUBLIC_API_BASE_URL = "http://test.local";

import { AdminApiError, completeAdminMission, isMissionStepConflict } from "./adminApi";

function stubFetch(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  (globalThis as { fetch?: typeof fetch }).fetch = (async (
    url: string,
    init: RequestInit,
  ) => {
    calls.push({ url, init });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  }) as typeof fetch;
  return calls;
}

test("completeAdminMission은 확인받은 STEP을 그대로 본문에 담아 보낸다", async () => {
  const calls = stubFetch(200, { matchId: 1, currentStep: 2 });

  await completeAdminMission(1, 1);

  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, "http://test.local/api/admin/missions/1/complete");
  assert.equal(calls[0]!.init.method, "POST");
  assert.equal(JSON.parse(calls[0]!.init.body as string).expectedStep, 1);
  assert.equal(
    (calls[0]!.init.headers as Record<string, string>)["Content-Type"],
    "application/json",
  );
});

test("서버가 409를 돌려주면 isMissionStepConflict가 참이다", async () => {
  stubFetch(409, { code: "MISSION_STEP_MISMATCH", message: "이미 처리됐습니다." });

  await assert.rejects(
    completeAdminMission(1, 1),
    (error) => {
      assert.ok(isMissionStepConflict(error));
      return true;
    },
  );
});

test("409가 아닌 다른 오류는 conflict로 취급하지 않는다", async () => {
  stubFetch(400, { code: "VALIDATION", message: "요청이 올바르지 않습니다." });

  await assert.rejects(
    completeAdminMission(1, 1),
    (error) => {
      assert.ok(error instanceof AdminApiError);
      assert.equal(isMissionStepConflict(error), false);
      return true;
    },
  );
});

test("AdminApiError가 아닌 값은 conflict로 취급하지 않는다", () => {
  assert.equal(isMissionStepConflict(new Error("아무 오류")), false);
  assert.equal(isMissionStepConflict(null), false);
});
