/**
 * 프로필 사진이 없는 참가자의 아바타 배경색.
 *
 * userId로 고르기 때문에 같은 사람은 어느 화면에서 봐도 같은 색이다 —
 * 목록에서 보던 색이 채팅에서 달라지면 다른 사람처럼 보인다.
 */
const AVATAR_COLORS = ["#4F46E5", "#22C55E", "#5B5FE9", "#F59E0B", "#EF4444"];

export function avatarColor(userId: number) {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}
