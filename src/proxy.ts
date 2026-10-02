import { NextResponse, type NextRequest } from "next/server";
import { SERVICE_ENDED_PATH, SERVICE_END_STATUS_PATH, isServiceEnded } from "@ui/공통/serviceEnd";

/**
 * 서비스 종료 시각(`SERVICE_END_AT`) 이후 모든 화면 요청을 종료 화면으로 보낸다(facecook-fe#127).
 *
 * 요청마다 서버에서 판단하므로 로그인 화면의 자동 이동보다 먼저 실행된다. 열려 있던 옛 화면이 BE의 401을 받고
 * `/login`으로 페이지를 새로 여는 경우도 여기서 종료 화면으로 바뀐다.
 *
 * `SERVICE_END_STATUS_PATH`에는 종료 여부를 JSON으로 답한다. 열려 있는 화면의 `ServiceEndWatcher`가 휴대폰 시계 대신
 * 이 서버 시계로 판단한다.
 *
 * `SERVICE_END_AT`은 서버 변수다. 화면 코드에도 빌드할 때 들어가므로(next.config.ts) 값을 바꾸면 재배포해야 한다.
 *
 * 종료 전이어도 `/ended`는 막지 않는다. BE의 `SERVICE_END_AT`이 이 값보다 조금이라도 빠르면, 화면은 BE 응답을 보고
 * `/ended`로 오는데 여기서 다시 돌려보내면 두 이동이 계속 반복된다.
 */
export function proxy(request: NextRequest) {
  const ended = isServiceEnded(process.env.SERVICE_END_AT, Date.now());
  const { pathname } = request.nextUrl;

  if (pathname === SERVICE_END_STATUS_PATH) {
    return NextResponse.json({ ended }, { headers: { "Cache-Control": "no-store" } });
  }
  if (ended && pathname !== SERVICE_ENDED_PATH) {
    return NextResponse.redirect(new URL(SERVICE_ENDED_PATH, request.url));
  }
  return NextResponse.next();
}

export const config = {
  // 종료 화면과 설치형 앱이 쓰는 파일만 그대로 둔다(화면 JS·CSS, 이미지 최적화, public의 파일).
  // 확장자로 넓게 빼면 `/profile/1.foo` 같은 화면 주소가 차단을 피해 간다.
  // public에 파일을 추가하면 여기에도 넣는다.
  matcher: [
    "/((?!_next/static/|_next/image|(?:favicon\\.ico|icon-192\\.png|icon-512\\.png|icon-maskable-512\\.png|apple-touch-icon\\.png|manifest\\.webmanifest|push-sw\\.js|offline\\.html|mascot\\.png|chat\\.png|avatars/[^/]+\\.jpg|mascots/[^/]+\\.png)$).*)",
  ],
};
