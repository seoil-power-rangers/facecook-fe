"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PROGRESS_SLOTS } from "./constants";
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

/**
 * 단계가 갈수록 히어로를 얕게 깐다. 색을 바꾸지 않고 진행감을 주려는 것이고,
 * 뒤 단계일수록 입력 항목이 많아서 본문 자리가 넓어지는 실익도 있다.
 */
const HERO_PADDING_BOTTOM: Record<number, string> = {
  1: "pb-[22px]",
  2: "pb-[20px]",
  3: "pb-[18px]",
  4: "pb-[16px]",
  5: "pb-[14px]",
};

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
   * 주의문은 알약이나 세로줄로 감싸지 않는다 — 알약은 단계 표시와 형태가
   * 같아져 같은 종류로 보이고, 세로줄은 인용문처럼 읽힌다. 보라 위에서
   * 연노랑은 흰 본문과 색상이 충분히 갈리므로 굵기와 색만으로 둔다.
   */
  const noteClassName =
    noteTone === "warning"
      ? "font-bold text-(--color-hero-warning)"
      : "text-(--color-hero-text)";

  return (
    // -mx-5로 레이아웃의 가로 여백을 뚫고 화면 끝까지 깔린다.
    <header
      className={`-mx-5 mb-6 px-5 pt-4 text-white/85 ${
        step === undefined ? "pb-6" : HERO_PADDING_BOTTOM[step] ?? "pb-6"
      }`}
      style={HERO_STYLE}
    >
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="뒤로"
        className="-ml-1 mb-3.5 block text-(--color-hero-text)"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {step !== undefined ? (
        /*
         * 진행바·단계 알약·제목이 전부 "지금 몇 번째인지"를 말하던 것을 둘로
         * 줄였다. 알약을 빼면 제목이 위로 올라와 첫 입력칸이 더 빨리 보인다.
         */
        <div className="flex items-center gap-2">
          <ProgressBar step={step} />
          <span className="text-[11px] font-bold tabular-nums text-(--color-hero-text)">
            {step}/{PROGRESS_SLOTS}
          </span>
        </div>
      ) : null}

      <h1 className="mt-3.5 text-[22px] font-bold leading-snug">{title}</h1>
      {note ? <p className={`mt-2.5 text-[13px] ${noteClassName}`}>{note}</p> : null}
    </header>
  );
}
