"use client";

import type { PostHog } from "posthog-js";

import { REPLAY_BLOCK_CLASS } from "./avatarColor";
import { startWatchingKillSwitches } from "./killSwitch";

/**
 * 사용 로그 수집. 부스 3일 동안 어디서 사람이 빠져나가는지 보려고 둔다.
 *
 * 수집 방침은 하나다 — **여기 적힌 이벤트만 보낸다.**
 * PostHog 기본값인 autocapture(모든 클릭·입력 자동 수집)는 끈다. 소개팅
 * 서비스라 화면에 자기소개·학과·MBTI·사진이 늘 떠 있고, 자동 수집을 켜면
 * 그게 통째로 분석 서버로 넘어간다. 약관에서 받은 개인정보 수집 동의
 * 범위(docs/보안체크리스트.md)를 벗어난다.
 *
 * 같은 이유로 사람을 가리키는 값은 서버가 준 userId(숫자)만 쓴다. 이메일·
 * 닉네임은 보내지 않는다.
 *
 * 키가 없으면 아무것도 하지 않는다 — 로컬 개발이나 키를 안 넣은 배포에서
 * 화면이 깨지면 안 되므로, 이 파일의 모든 함수는 조용히 no-op이 된다.
 *
 * SDK는 정적으로 import하지 않는다. 그렇게 하면 모든 화면의 첫 로딩
 * 번들에 gzip 기준 94KB가 얹히는데(측정치), 로그 수집 때문에 로그인
 * 화면이 늦게 뜨는 건 앞뒤가 바뀐 얘기다. 브라우저가 한가해진 뒤에
 * 내려받고, 그 전에 생긴 이벤트는 큐에 담아뒀다가 흘려보낸다.
 */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * 세션 리플레이(화면 녹화)를 켤지. 테스터 20명한테 동의를 받고 보는
 * 2주 동안만 켜고, 축제 기간에는 끈다 — 실제 참가자의 채팅 화면이
 * 녹화되는 건 동의 범위 밖이다.
 */
const ENABLE_REPLAY = process.env.NEXT_PUBLIC_POSTHOG_REPLAY === "true";

/** 로딩이 끝나기 전에는 null. 끝나면 이후 호출은 곧장 여기로 간다. */
let client: PostHog | null = null;
let started = false;

/**
 * SDK가 준비되기 전에 생긴 호출을 담아둔다.
 *
 * 비워두면 가장 이른 이벤트들이 통째로 사라진다 — PWA 설치 상태는 앱이
 * 뜨자마자 한 번만 찍히고, 첫 화면의 pageview도 마찬가지다. 상한을 두는
 * 건 SDK가 끝내 안 올라오는 경우(키 오류, 차단기) 메모리가 계속 차는 걸
 * 막기 위해서다.
 */
const pending: Array<(posthog: PostHog) => void> = [];
const PENDING_LIMIT = 50;

function withClient(run: (posthog: PostHog) => void) {
  if (client) {
    try {
      run(client);
    } catch {
      // 로그 수집 실패로 사용자 흐름을 막지 않는다.
    }
    return;
  }
  if (!started) return; // 키가 없어 아예 시작하지 않은 경우
  if (pending.length < PENDING_LIMIT) pending.push(run);
}

/**
 * 보내는 이벤트 목록. 여기 없는 이름은 타입이 막는다.
 *
 * 축제가 끝나면 다시 모을 수 없어서, 붙이는 시점에 필요한 걸 다 정해둔다.
 * 안 심은 이벤트는 나중에 영영 없는 데이터다.
 */
export type AnalyticsEvent =
  /** 온보딩 5단계 중 한 화면에 도착 — 단계별 이탈률의 재료 */
  | { name: "onboarding_step_viewed"; props: { step: OnboardingStep } }
  | { name: "onboarding_completed"; props?: never }
  /**
   * 가입 퍼널의 맨 앞. 부스에서 학교 메일을 못 열거나 코드가 안 오는 등
   * 실패 지점이 많은 구간이라, 화면 도달(onboarding_step_viewed)만으로는
   * 원인을 가릴 수 없어서 따로 남긴다.
   */
  | { name: "signup_code_requested"; props?: never }
  | { name: "signup_verified"; props?: never }
  | { name: "login_succeeded"; props: { role: UserRole } }
  /**
   * 콕을 보낸 지점. 탐색 목록에서 바로 보내는지, 상세를 보고 보내는지.
   *
   * 받은 콕에 답하는 맞콕도 같은 API를 쓰므로 from: "kok"이 곧 수락이다 —
   * 그래서 cook_accepted를 따로 두지 않는다.
   */
  | { name: "cook_sent"; props: { from: "explore" | "profile_detail" | "kok" } }
  /**
   * 콕을 못 보낸 경우. 성공만 세면 "못 보낸 사람이 왜 못 보냈는지"가 통째로
   * 안 보인다. 사유별로 해석이 갈린다 — DAILY_LIMIT이 많으면 한도가 낮은
   * 것이고, DUPLICATE가 많으면 이미 보낸 상대를 화면이 구분해주지 못하는
   * 것이다.
   */
  | {
      name: "cook_failed";
      props: { code: string; from: "explore" | "profile_detail" | "kok" };
    }
  | { name: "match_created"; props?: never }
  /** 매칭됐지만 대화까지 가지 않는 비율을 보려면 방 진입을 따로 세야 한다. */
  | { name: "chat_room_opened"; props?: never }
  | { name: "chat_message_sent"; props?: never }
  /** 채팅 신뢰성 — ACK 10초 안에 안 온 경우 */
  | { name: "chat_ack_timeout"; props?: never }
  | { name: "chat_socket_error"; props: { code: string } }
  /** 탐색 필터를 실제로 쓰는 사람이 얼마나 되는지 */
  | { name: "explore_filter_applied"; props: { count: number } }
  /** PWA 설치 — 아이폰 웹푸시가 설치를 전제로 해서 도달률의 상한이 된다 */
  | { name: "pwa_install_state"; props: { state: string } }
  | { name: "pwa_install_result"; props: { outcome: "accepted" | "dismissed" } }
  | { name: "push_permission"; props: { result: NotificationPermission } }
  /** 프로필 사진을 실제로 올리는 비율. 기본 아바타로 남는 사람이 얼마인지 */
  | { name: "profile_photo_uploaded"; props?: never }
  /**
   * 미션은 매칭 이후 체류를 늘리려고 넣은 기능이라 도달 자체가 지표다.
   * currentStep은 1~3이 진행 중인 단계, 4가 전부 완료를 뜻한다(missionModel.ts).
   */
  | { name: "mission_viewed"; props: { currentStep: number } }
  | { name: "report_submitted"; props?: never }
  /**
   * 세션이 끊겨 로그인 화면으로 돌려보낸 순간.
   *
   * 부스에서 "로그인이 자꾸 풀려요"가 나오면 이 로그 말고는 단서가 없다.
   * 몇 명에게 얼마나 자주 일어나는지를 여기서만 알 수 있다.
   */
  | { name: "session_expired"; props: { reason: string } };

export type UserRole = "participant" | "admin" | "super";

export type OnboardingStep =
  | "email"
  | "basic"
  | "mbti"
  | "hobby"
  | "optional"
  | "done";

/**
 * 로그 수집을 시작한다. 곧바로 받지 않고 브라우저가 한가해질 때까지 미룬다.
 *
 * timeout을 두는 이유: 사용자가 계속 스크롤하거나 입력하면 유휴 시점이
 * 영영 안 올 수 있어서, 3초가 지나면 그냥 받는다. requestIdleCallback이
 * 없는 브라우저(일부 사파리)는 타이머로 대신한다.
 */
export function initAnalytics() {
  if (started || !POSTHOG_KEY || typeof window === "undefined") return;
  started = true;

  const load = () => {
    void import("posthog-js")
      .then(({ default: posthog }) => {
        setUpPostHog(posthog);
        client = posthog;
        for (const run of pending.splice(0)) {
          try {
            run(posthog);
          } catch {
            // 한 건이 실패해도 나머지는 흘려보낸다.
          }
        }
        startWatchingKillSwitches(posthog, { replayAllowed: ENABLE_REPLAY });
      })
      .catch(() => {
        // 차단기나 네트워크로 못 받아오면 수집만 없는 상태로 둔다.
        pending.length = 0;
      });
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(load, { timeout: 3000 });
  } else {
    window.setTimeout(load, 2000);
  }
}

function setUpPostHog(posthog: PostHog) {
  posthog.init(POSTHOG_KEY!, {
    api_host: POSTHOG_HOST,
    // 아래 두 개가 이 파일의 핵심이다. 위 주석 참고.
    autocapture: false,
    capture_pageview: false,
    // 사용자가 화면을 떠날 때 마지막 이벤트를 놓치지 않게 한다.
    capture_pageleave: true,
    // 로그인한 사람만 프로필을 만든다 — 비로그인 방문자까지 사람으로 세면
    // 무료 한도를 쓸데없이 깎아먹는다.
    person_profiles: "identified_only",
    /*
     * 잡히지 않은 에러와 promise rejection을 모은다. 부스에서 흰 화면을 본
     * 사람이 말해주기를 기다릴 수는 없다.
     *
     * 이 기능은 별도 스크립트로 따로 내려받아서(loadExternalDependency)
     * 초기 번들을 늘리지 않는다.
     */
    capture_exceptions: true,
    /*
     * SDK는 모든 이벤트에 현재 주소를 자동으로 붙인다. 이 앱의 주소에는
     * 남의 userId와 매칭 ID가 들어 있어서(/profile/12, /match/34) 그대로
     * 두면 이벤트마다 그게 실려 나간다. 한 곳에서 전부 덮는다 —
     * 이벤트를 새로 추가할 때 빠뜨릴 여지를 없애려고 여기 둔다.
     */
    before_send: (event) => {
      const properties = event?.properties;
      if (properties) {
        for (const key of URL_PROPERTIES) {
          const value = properties[key];
          if (typeof value === "string") properties[key] = maskPath(value);
        }
      }
      return event;
    },
    disable_session_recording: !ENABLE_REPLAY,
    session_recording: {
      // 입력값은 전부 가린다. 자기소개·비밀번호·인증코드가 여기 다 들어온다.
      maskAllInputs: true,
      /*
       * 화면 텍스트를 통째로 가린다.
       *
       * 처음에는 data-private를 단 곳만 가렸는데, 그 방식은 가릴 곳을 사람이
       * 빠짐없이 찾아내야만 성립한다. 실제로는 닉네임·나이·성별·학과·MBTI·
       * 취미가 탐색과 프로필 곳곳에 흩어져 있고, 관리자 화면에는 이메일까지
       * 나온다. 하나라도 빠지면 그대로 녹화된다.
       *
       * 더 중요한 건 동의의 범위다. 녹화 동의는 테스터 본인에게만 받았는데,
       * 화면에 등장하는 상대 참가자는 동의한 적이 없다. 소개팅 서비스라
       * 남의 얼굴과 신상이 늘 화면에 있으므로, 기본값을 "가린다"로 두고
       * 필요하면 푸는 방향이 맞다.
       *
       * 대신 리플레이에서 글자는 못 읽는다. 레이아웃·클릭·스크롤·헛누름은
       * 그대로 보이므로 사용성 관찰이라는 목적은 유지된다.
       */
      maskTextSelector: "*",
      // aria-label 같은 속성에도 닉네임이 들어간다.
      maskAllElementAttributes: true,
      /*
       * 이미지는 마스킹으로 못 가린다 — 글자만 가려지고 src는 그대로 기록돼서,
       * 재생할 때 원본을 다시 불러온다. 참가자가 올린 얼굴 사진이 여기
       * 해당하므로 요소째 차단한다(avatarColor.ts의 REPLAY_BLOCK_CLASS).
       * 파일 입력도 같이 막는다 — 업로드한 파일명도 신상이다.
       */
      blockSelector: `.${REPLAY_BLOCK_CLASS}, input[type="file"]`,
    },
  });
}

/**
 * 삼켜버린 에러 중 조용히 죽으면 곤란한 것만 올린다.
 *
 * 배지 조회처럼 실패해도 화면을 막지 않는 요청이 여럿 있는데(부가 정보라
 * 그게 맞다), 그대로 두면 축제 당일 그 API가 전부 500을 뱉어도 아무도
 * 모른다. 화면은 멀쩡해 보이고 배지만 조용히 사라진다.
 */
export function reportError(error: unknown) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  if (!shouldReport(normalized)) return;
  withClient((posthog) => posthog.captureException(normalized));
}

/**
 * 같은 에러를 몇 번이고 다시 올리지 않게 막는다.
 *
 * 이게 없으면 서버가 아플 때 상황이 더 나빠진다 — 배지 폴링이 5초마다
 * 도는데 그 안에서 실패가 세 건 나므로, 백엔드가 죽으면 사용자 한 명당
 * 분당 36건이 올라간다. 접속자가 붙으면 분당 수천 건이다. 장애를 알리려고
 * 넣은 장치가 장애를 키우는 셈이고, 무료 한도도 몇 분 만에 동난다.
 *
 * 같은 종류는 1분에 한 번만 보내고, 한 세션에서 올리는 종류 수에도 상한을
 * 둔다(메시지가 매번 달라지는 에러가 상한을 우회하는 걸 막는다).
 */
const reported = new Map<string, number>();
const REPORT_INTERVAL_MS = 60_000;
const REPORT_KIND_LIMIT = 20;

function shouldReport(error: Error) {
  const key = `${error.name}: ${error.message}`;
  const now = Date.now();
  const last = reported.get(key);

  if (last !== undefined && now - last < REPORT_INTERVAL_MS) return false;
  if (last === undefined && reported.size >= REPORT_KIND_LIMIT) return false;

  reported.set(key, now);
  return true;
}

/** 이벤트 하나 보낸다. 키가 없거나 실패해도 화면은 그대로 굴러가야 한다. */
export function track(event: AnalyticsEvent) {
  withClient((posthog) => posthog.capture(event.name, event.props));
}

/**
 * 로그인 성공 시점에 부른다. 이메일·닉네임이 아니라 userId만 넘긴다.
 *
 * 이걸 불러야 "가입 → 콕 → 매칭"이 한 사람의 여정으로 이어진다. 안 부르면
 * 익명 ID가 기기마다 따로 잡혀서 퍼널이 끊긴다.
 */
export function identifyUser(userId: number, role: UserRole) {
  withClient((posthog) => posthog.identify(String(userId), { role }));
}

/** 로그아웃·세션 만료 시점. 다음 사람이 같은 폰을 쓸 때 섞이지 않게 끊는다. */
export function resetAnalytics() {
  withClient((posthog) => posthog.reset());
}

/**
 * 화면 이동 기록. App Router는 SPA 전환이라 PostHog가 자동으로 잡지 못해서
 * (capture_pageview: false) AnalyticsBootstrap이 경로가 바뀔 때마다 부른다.
 *
 * 경로를 그대로 보내지 않는다 — /profile/12, /match/34처럼 URL에 남의 userId와
 * 매칭 ID가 들어 있어서, 숫자 자리는 [id]로 덮어 어떤 종류의 화면인지만 남긴다.
 */
export function trackPageview(pathname: string) {
  void pathname; // 주소는 SDK가 붙이고 before_send가 가린다
  withClient((posthog) => posthog.capture("$pageview"));
}

/** 주소가 담기는 속성들. before_send가 이 값들을 전부 가린다. */
const URL_PROPERTIES = [
  "$current_url",
  "$pathname",
  "$initial_current_url",
  "$initial_pathname",
  "$referrer",
  "$initial_referrer",
] as const;

/** "/profile/12" → "/profile/[id]". 전체 URL이 와도 경로 부분만 바뀐다. */
function maskPath(url: string) {
  return url.replace(/\/\d+/g, "/[id]");
}
