import { redirect } from "next/navigation";

/**
 * 진입점. 예전에는 QR 진입 화면을 띄웠지만 가입·로그인을 로그인 화면 하나로
 * 합치면서 없앴다.
 *
 * 경로까지 지우지는 않는다 — manifest의 start_url이 "/"라서 홈 화면에 설치된
 * 앱이 여는 주소가 여기고, 로그아웃도 여기로 돌아온다.
 */
export default function Page() {
  redirect("/login");
}
