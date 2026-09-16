"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Avatar } from "./Avatar";
import { BottomSheet } from "./BottomSheet";
import {
  profileErrorMessage,
  uploadProfilePhoto,
} from "@ui/프로필작성/profileApi";

interface AvatarPhotoPickerProps {
  name: string;
  userId?: number;
  photoUrl: string | null;
  gender?: string | null;
  onChange: (photoUrl: string | null) => void;
  onError?: (message: string) => void;
  size?: "xl" | "2xl";
}

/**
 * 아바타 오른쪽 아래에 카메라 버튼을 얹는다. 누르면 "사진 선택/기본 사진"
 * 두 옵션을 보여준다 — 인스타그램류 프로필 사진 수정과 같은 자리, 같은 동작.
 *
 * 실제 업로드(presigned URL 발급 → S3 PUT)는 profileApi의
 * uploadProfilePhoto가 맡고, 이 컴포넌트는 그 결과(최종 URL 또는 null)만
 * onChange로 부모에 돌려준다 — 저장(등록/수정) 시점과 제출 방식은
 * 화면마다 다르므로 여기서 API를 직접 호출하지 않는다.
 */
export function AvatarPhotoPicker({
  name,
  userId,
  photoUrl,
  gender,
  onChange,
  onError,
  size = "2xl",
}: AvatarPhotoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // 같은 파일을 다시 골라도 change가 또 뜨도록 비운다

    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadProfilePhoto(file);
      onChange(uploadedUrl);
    } catch (error) {
      onError?.(profileErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative inline-flex">
      <Avatar name={name} userId={userId} photoUrl={photoUrl} gender={gender} size={size} />

      <button
        type="button"
        aria-label="프로필 사진 변경"
        disabled={isUploading}
        onClick={() => setIsMenuOpen(true)}
        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-(--color-surface) bg-(--color-primary) text-(--color-text-on-primary) disabled:opacity-60"
      >
        <Camera className="h-4 w-4" aria-hidden="true" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFileSelected(event)}
      />

      <BottomSheet open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <div className="flex flex-col gap-1 px-3">
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              fileInputRef.current?.click();
            }}
            className="rounded-(--radius-md) px-4 py-3.5 text-left text-[15px] font-medium text-(--color-text-strong) active:bg-(--color-surface-alt)"
          >
            사진 선택
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onChange(null);
            }}
            className="rounded-(--radius-md) px-4 py-3.5 text-left text-[15px] font-medium text-(--color-danger) active:bg-(--color-surface-alt)"
          >
            기본 사진
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
