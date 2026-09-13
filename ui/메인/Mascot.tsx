"use client";

import { useState } from "react";

/** 여기에 파일을 넣으면 바로 뜬다. 투명 배경 PNG를 권장한다. */
const MASCOT_SRC = "/mascot.png";

/**
 * 홈 히어로의 마스코트(안뇽).
 *
 * 아직 파일이 레포에 없어서, 없으면 자리 표시를 대신 보여준다.
 * public/mascot.png만 넣으면 이 컴포넌트는 손대지 않아도 된다.
 *
 * 배경이 흰 이미지를 넣으면 그라데이션 위에 흰 사각형이 떠 보인다.
 * 배경을 지운 PNG를 쓰면 모래밭에 서 있는 것처럼 보인다.
 */
export function Mascot() {
  const [isMissing, setIsMissing] = useState(false);

  if (isMissing) {
    return (
      <div className="relative z-10 mt-4 flex h-52 w-full max-w-[260px] flex-col items-center justify-center gap-1 rounded-(--radius-lg) border-2 border-dashed border-(--color-surface) bg-white/40 px-4 text-center">
        <p className="text-sm font-bold text-(--color-text-body)">마스코트 자리</p>
        <p className="text-xs leading-relaxed text-(--color-text-sub)">
          <code className="font-mono">public/mascot.png</code>를 넣으면
          <br />
          여기에 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="relative z-10 mt-2 flex w-full justify-center">
      {/* 발밑 그림자. 배경을 지운 이미지일 때 바닥에 붙어 보이게 한다. */}
      <span
        className="absolute bottom-2 h-4 w-36 rounded-[50%] bg-black/10 blur-[6px]"
        aria-hidden="true"
      />
      {/* 정적 파일이라 next/image의 최적화가 필요 없다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MASCOT_SRC}
        alt="서일대학교 마스코트 안뇽"
        className="relative h-52 w-auto max-w-full object-contain"
        onError={() => setIsMissing(true)}
      />
    </div>
  );
}
