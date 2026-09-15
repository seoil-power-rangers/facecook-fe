"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ProgressBar } from "./ProgressBar";

/** 제목 안에서 강조되는 부분. 시안이 매 화면 앞머리를 강조한다. */
export function Accent({ children }: { children: ReactNode }) {
  return <span className="text-(--color-primary)">{children}</span>;
}

/**
 * 히어로는 본문과 배경이 반대라, 화면이 넘겨준 문구가 본문 팔레트 그대로
 * 보라 위에 올라가면 읽히지 않는다. 문구 쪽이 쓰는 토큰만 여기서 히어로용
 * 값으로 덮어써서(Accent는 primary, 경고 문구는 warning), 화면 컴포넌트는
 * 히어로를 모르는 채로 색만 따라오게 한다.
 *
 * 흰 배경에서는 강조가 "색이 있는 쪽"이지만 여기서는 반대다 — 제목 본문을
 * 살짝 죽이고(85%) 강조를 순백으로 둬서 강조가 더 밝게 읽히게 한다.
 */
const HERO_STYLE = {
  "--color-primary": "var(--color-hero-text)",
  "--color-warning": "var(--color-hero-warning)",
  backgroundImage:
    "linear-gradient(160deg, var(--color-hero-from), var(--color-hero-to))",
} as CSSProperties;

interface StepHeaderProps {
  step?: number;
  title: ReactNode;
  note?: ReactNode;
  noteTone?: "muted" | "warning";
}

export function StepHeader({
  step,
  title,
  note,
  noteTone = "muted",
}: StepHeaderProps) {
  const router = useRouter();

  /*
   * 주의문은 보라 위에서 색만으로는 눈에 안 띈다 — AA를 지키면 흰색에 가까워
   * 져 본문과 구분이 사라지기 때문이다. 문장 전체가 주의문일 때는 알약으로
   * 감싸 덩어리째 도드라지게 한다. 문장 안에 박힌 강조는 조사가 붙어 있어
   * 감쌀 수 없으므로 화면 쪽에서 굵기로 준다.
   */
  const noteClassName =
    noteTone === "warning"
      ? "inline-block rounded-(--radius-full) bg-white/20 px-3 py-1 font-bold text-(--color-hero-text)"
      : "text-(--color-hero-text)";

  return (
    // -mx-5로 레이아웃의 가로 여백을 뚫고 화면 끝까지 깔린다.
    <header
      className="-mx-5 mb-6 px-5 pb-6 pt-4 text-white/85"
      style={HERO_STYLE}
    >
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="뒤로"
        className="-ml-1 mb-5 block text-(--color-hero-text)"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {step !== undefined ? (
        <>
          <ProgressBar step={step} />
          <p className="mt-5 inline-block rounded-(--radius-full) bg-white/20 px-2.5 py-1 text-[11px] font-bold tracking-wide text-(--color-hero-text)">
            STEP {step}
          </p>
        </>
      ) : null}

      <h1 className="mt-2.5 text-[22px] font-bold leading-snug">{title}</h1>
      {note ? <p className={`mt-2 text-[13px] ${noteClassName}`}>{note}</p> : null}
    </header>
  );
}
