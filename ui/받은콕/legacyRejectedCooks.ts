/**
 * 서버에 거절 API가 없던 때 거절을 브라우저에만 저장하던 키(`facecook:kok:rejected`).
 * 계정 구분 없이 cookId만 저장돼 있어서 서버로 옮기지 않고 버린다 — 거절 여부는 이제 서버 목록으로 판단한다.
 *
 * 부작용: 이 브라우저의 localStorage에서 해당 키를 지운다. 저장소를 못 쓰는 환경(시크릿 모드 등)이면
 * 아무 것도 하지 않는다.
 */
const LEGACY_STORAGE_KEY = "facecook:kok:rejected";

export function clearLegacyRejectedCooks() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // 저장소를 못 쓰면 지울 것도 없다.
  }
}
