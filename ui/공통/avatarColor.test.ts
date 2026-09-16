import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPhotoForGender, resolveAvatarPhoto } from "./avatarColor";

test("성별에 맞는 기본 프로필 이미지를 선택한다", () => {
  assert.equal(defaultPhotoForGender("여성"), "/avatars/default-female.jpg");
  assert.equal(defaultPhotoForGender("female"), "/avatars/default-female.jpg");
  assert.equal(defaultPhotoForGender("남성"), "/avatars/default-male.jpg");
  assert.equal(defaultPhotoForGender("male"), "/avatars/default-male.jpg");
});

test("알 수 없는 성별은 중립 아바타로 폴백할 수 있게 null을 반환한다", () => {
  assert.equal(defaultPhotoForGender(""), null);
  assert.equal(defaultPhotoForGender("기타"), null);
  assert.equal(defaultPhotoForGender("unknown"), null);
});

test("공백 사진 URL을 무시하고 성별 기본 이미지로 폴백한다", () => {
  assert.equal(resolveAvatarPhoto(" ", "여성"), "/avatars/default-female.jpg");
  assert.equal(resolveAvatarPhoto("  ", "남성"), "/avatars/default-male.jpg");
  assert.equal(resolveAvatarPhoto(" ", "unknown"), null);
});

test("업로드 사진 URL의 앞뒤 공백을 제거한다", () => {
  assert.equal(
    resolveAvatarPhoto("  https://example.com/avatar.jpg  ", "여성"),
    "https://example.com/avatar.jpg",
  );
});
