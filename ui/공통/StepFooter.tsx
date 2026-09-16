import type { ReactNode } from "react";

interface StepFooterProps {
  /**
   * 버튼이 안 눌리는 이유. 온보딩은 대부분의 화면이 들어오자마자 비활성이라,
   * 이유를 안 적으면 회색 덩어리만 보고 왜 못 넘어가는지 모른 채 멈춘다.
   * 채울 게 다 채워졌으면 넘기지 않는다.
   */
  hint?: ReactNode;
  children: ReactNode;
}

/** 온보딩 단계 화면 맨 아래에 붙는 버튼 자리. 위치와 여백을 한 곳에서 잡는다. */
export function StepFooter({ hint, children }: StepFooterProps) {
  return (
    <div className="mt-auto pt-8">
      {hint ? (
        <p className="mb-2 text-center text-[12px] text-(--color-text-sub)">
          {hint}
        </p>
      ) : null}
      {children}
    </div>
  );
}
