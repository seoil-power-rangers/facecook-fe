import { NextResponse, type NextRequest } from "next/server";
import { SERVICE_ENDED_PATH, isServiceEnded } from "@ui/공통/serviceEnd";

/**
 * 서비스 종료 시각(`SERVICE_END_AT`) 이후 모든 화면 요청을 종료 화면으로 보낸다(facecook-fe#127).
 *
 * 요청마다 서버에서 판단하므로 로그인 화면의 자동 이동보다 먼저 실행된다. 열려 있던 옛 화면이 BE의 401을 받고
 * `/login`으로 페이지를 새로 여는 경우도 여기서 종료 화면으로 바뀐다.
 *
 * `SERVICE_END_AT`은 `NEXT_PUBLIC_`이 아닌 서버 변수다. Vercel에서 값을 바꾸면 재배포해야 반영된다.
 *
 * 종료 전이어도 `/ended`는 막지 않는다. BE의 `SERVICE_END_AT`이 이 값보다 조금이라도 빠르면, 화면은 BE 응답을 보고
 * `/ended`로 오는데 여기서 다시 돌려보내면 두 이동이 계속 반복된다.
 */
export function proxy(request: NextRequest) {
  const ended = isServiceEnded(process.env.SERVICE_END_AT, Date.now());
  const { pathname } = request.nextUrl;

  if (ended && pathname !== SERVICE_ENDED_PATH) {
    return NextResponse.redirect(new URL(SERVICE_ENDED_PATH, request.url));
  }
  return NextResponse.next();
}

export const config = {
  // 화면 파일(JS·CSS), 이미지 최적화, 확장자가 있는 정적 파일(아이콘·서비스워커·offline.html·manifest)은 그대로 둔다.
  // 종료 화면도 로고와 스크립트를 불러와야 한다.
  matcher: ["/((?!_next/static|_next/image|.*\\.[A-Za-z0-9]+$).*)"],
};
