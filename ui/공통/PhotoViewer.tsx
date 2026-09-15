"use client";

import { X } from "lucide-react";

interface PhotoViewerProps {
  photoUrl: string;
  alt?: string;
  onClose: () => void;
}

/**
 * 프로필 사진을 탭하면 화면 전체로 확대해서 보여준다. 배경(어디든)이나
 * 닫기 버튼을 누르면 닫히고, 사진 자체를 눌렀을 땐 안 닫힌다.
 */
export function PhotoViewer({ photoUrl, alt = "", onClose }: PhotoViewerProps) {
  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-center justify-center bg-black/90"
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label="닫기"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white"
      >
        <X className="h-5 w-5" />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element -- S3 원본 URL이라 next/image 최적화 대상이 아니다. */}
      <img
        src={photoUrl}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[80vh] max-w-full object-contain"
      />
    </div>
  );
}
