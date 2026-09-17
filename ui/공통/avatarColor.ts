/**
 * 프로필 사진이 없는 참가자를 어떻게 그릴지.
 *
 * 둘 다 userId로 고르기 때문에 같은 사람은 어느 화면에서 봐도 같은 색·같은
 * 얼굴이다 — 목록에서 보던 모습이 채팅에서 달라지면 다른 사람처럼 보인다.
 */
/** 이모지가 위에 올라가므로 배경은 옅게 둔다. 진한 색이면 얼굴이 묻힌다. */
const AVATAR_COLORS = ["#F5C26B", "#A8CDE8", "#F0B48A", "#A8DCC0", "#C4B0E8"];

/** 색 개수와 서로 나누어떨어지지 않아야 색·얼굴 조합이 골고루 섞인다. */
const AVATAR_EMOJIS = [
  "🐱", "🐻", "🦊", "🐼", "🐶", "🐰",
  "🐯", "🐨", "🦁", "🐹", "🐸", "🐧",
];

export function avatarColor(userId: number) {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}

export function avatarEmoji(userId: number) {
  return AVATAR_EMOJIS[userId % AVATAR_EMOJIS.length];
}

const FEMALE_VALUES = new Set(["여성", "female", "woman", "f", "여"]);
const MALE_VALUES = new Set(["남성", "male", "man", "m", "남"]);

/** 사진을 안 올린 참가자에게 성별에 맞는 기본 실루엣을 준다. */
export function defaultPhotoForGender(gender: string): string | null {
  const normalized = gender.trim().toLowerCase();
  if (FEMALE_VALUES.has(normalized)) return "/avatars/default-female.jpg";
  if (MALE_VALUES.has(normalized)) return "/avatars/default-male.jpg";
  return null;
}

/**
 * 세션 리플레이에서 가릴 이미지에 다는 클래스.
 *
 * rrweb은 텍스트만 마스킹하고 이미지는 src를 그대로 기록한다 — 가려도
 * 재생하면 원본이 다시 불러와진다. 이 클래스가 붙은 요소는 플레이스홀더로
 * 대체되고 그 아래는 기록 자체가 멈춘다.
 */
export const REPLAY_BLOCK_CLASS = "ph-no-capture";

/**
 * 참가자가 직접 올린 사진인지. 성별 기본 실루엣은 우리가 넣어둔 정적
 * 파일이라 가릴 이유가 없고, 가리면 리플레이에서 화면 구성이 안 보인다.
 * 업로드 사진만 S3 절대 URL로 온다.
 */
export function isUploadedPhoto(photo: string | null | undefined) {
  return Boolean(photo) && !photo!.startsWith("/");
}

/** 업로드 사진을 우선하고, 없으면 성별 기본 이미지나 중립 아바타로 폴백한다. */
export function resolveAvatarPhoto(
  photoUrl?: string | null,
  gender?: string | null,
): string | null {
  const normalizedPhoto = photoUrl?.trim();
  if (normalizedPhoto) return normalizedPhoto;
  return gender ? defaultPhotoForGender(gender) : null;
}
