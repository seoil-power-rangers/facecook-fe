/**
 * 프로필 사진이 없는 참가자를 어떻게 그릴지.
 *
 * 탐색은 사진이 없으면 성별 기본 실루엣을 쓴다. 다른 화면은 userId로
 * 색·얼굴을 고른다.
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

/** 사진을 안 올린 참가자에게 성별에 맞는 기본 실루엣을 준다. */
export function defaultPhotoForGender(gender: string) {
  if (FEMALE_VALUES.has(gender.trim().toLowerCase())) {
    return "/avatars/default-female.jpg";
  }
  return "/avatars/default-male.jpg";
}
