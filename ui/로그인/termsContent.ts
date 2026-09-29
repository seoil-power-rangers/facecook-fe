import { EVENT, TERMS } from "@ui/공통/constants";

type TermId = (typeof TERMS)[number]["id"];

export interface TermSection {
  heading: string;
  items: string[];
}

/**
 * 약관 동의 창에서 각 항목의 `>`를 눌렀을 때 보여 주는 원문(facecook-fe#116).
 * 내용은 실제 수집·저장 방식(BE 가입·프로필·콕·채팅·신고·푸시 API, 인프라 구성)에 맞춰 적었다 — 수집 항목이나
 * 위탁처가 바뀌면 여기도 함께 고친다.
 */
export const TERMS_CONTENT: Record<TermId, TermSection[]> = {
  service: [
    {
      heading: "서비스 내용",
      items: [
        `${EVENT.name}는 ${EVENT.period} 행사 기간 동안 참가자끼리 콕을 주고받고, 서로 콕을 보내면 매칭되어 채팅과 미션을 할 수 있는 서비스입니다.`,
      ],
    },
    {
      heading: "이용 제한",
      items: [
        "다른 참가자를 불쾌하게 하거나 서비스 운영을 방해하는 행위는 신고될 수 있고, 운영진 확인 후 이용이 정지될 수 있습니다.",
      ],
    },
    {
      heading: "서비스 종료",
      items: [
        `행사가 끝나면 서비스는 종료되고, 모든 데이터는 ${EVENT.purgeDay}에 삭제됩니다.`,
      ],
    },
  ],
  privacy: [
    {
      heading: "수집 항목",
      items: [
        "이메일, 비밀번호(암호화하여 저장)",
        "프로필: 닉네임, 성별, 나이, MBTI, 취미, 혈액형 (학과·학년·자기소개·이상형은 선택)",
        "서비스 이용 기록: 콕, 매칭, 채팅 메시지, 신고, 마지막 접속 시각",
        "알림 수신 정보(알림을 켠 경우)",
      ],
    },
    {
      heading: "이용 목적",
      items: [
        "행사 참가자 간 매칭과 채팅 서비스 제공",
        "부정 이용 방지와 신고 처리",
      ],
    },
    {
      heading: "보유 기간",
      items: [`행사 종료 후 ${EVENT.purgeDay}에 모두 삭제합니다.`],
    },
    {
      heading: "처리 위탁·저장",
      items: [
        "AWS(서울 리전): 서버와 데이터 저장",
        "Vercel: 웹 화면 제공",
        "Brevo: 인증 메일 발송",
        "PostHog: 이용 통계",
      ],
    },
    {
      heading: "동의 거부",
      items: ["동의를 거부할 수 있으나, 거부하면 서비스를 이용할 수 없습니다."],
    },
  ],
  photo: [
    {
      heading: "프로필 사진",
      items: [
        "올린 사진은 다른 참가자에게 공개됩니다.",
        `행사 종료 후 ${EVENT.purgeDay}에 삭제됩니다.`,
        "동의하지 않아도 사진 없이 서비스를 이용할 수 있습니다.",
      ],
    },
  ],
};
