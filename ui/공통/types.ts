/**
 * 온보딩이 화면을 건너며 모으는 입력값.
 *
 * 한때 이 파일에는 DB 테이블을 그대로 옮긴 타입이 함께 있었다. 서버가 붙기
 * 전 목업이 그 모양을 따르던 시절의 것인데, 목업이 사라진 뒤로는 아무도
 * 쓰지 않으면서 CookStatus 같은 이름만 각 *Api.ts와 겹쳐 남았다. 값도
 * 어긋나 있어서(여기는 두 가지, cookApi는 네 가지) 잘못 가져다 쓰면 있는
 * 상태를 없는 것으로 다루게 된다. 서버 응답의 모양은 각 *Api.ts가 정의하는
 * 것이 맞아서 그쪽만 남긴다.
 */

export interface OnboardingDraft {
  email: string;
  /** 최초 가입 시 함께 설정하는 비밀번호. 이후 로그인은 이메일 인증 대신 이걸로 한다. */
  password: string;
  agreedTerms: string[];
  nickname: string;
  gender: string;
  age: string;
  bloodType: string;
  mbti: string[];
  activities: string[];
  photoUrl: string;
  department: string;
  grade: string;
  bio: string;
  idealType: string;
}

export const EMPTY_DRAFT: OnboardingDraft = {
  email: "",
  password: "",
  agreedTerms: [],
  nickname: "",
  gender: "",
  age: "",
  bloodType: "",
  mbti: [],
  activities: [],
  photoUrl: "",
  department: "",
  grade: "",
  bio: "",
  idealType: "",
};
