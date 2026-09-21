// ui/**/*.test.ts 를 모두 컴파일해서 node:test로 실행한다.
//
// 전제조건: 테스트가 가져오는 모듈은 `@ui/...` 별칭이나 React/Next 없이 상대 경로로만 서로를
// 참조한다. tsc는 별칭을 런타임 경로로 바꿔 주지 않기 때문에, 화면 코드에서 테스트할 로직은
// 별칭 없는 순수 모듈로 분리해 둔다(예: ui/공통/liveBadgesCore.ts).
//
// 부작용: .next/test 를 지우고 다시 만든다.
import { spawnSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(".next", "test");

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function findTestFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return findTestFiles(path);
    return entry.name.endsWith(".test.js") ? [path] : [];
  });
}

rmSync(OUT_DIR, { recursive: true, force: true });
run(process.execPath, [join("node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.test.json"]);

const files = findTestFiles(OUT_DIR);
if (files.length === 0) {
  console.error("실행할 테스트 파일(*.test.ts)이 없다.");
  process.exit(1);
}
run(process.execPath, ["--test", ...files]);
