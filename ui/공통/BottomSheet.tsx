"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "./cn";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

// sheet-slide-down / sheet-dim-out 애니메이션 길이와 맞춰야 언마운트 전에 재생이 끝남
const EXIT_DURATION_MS = 280;

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const lastChildrenRef = useRef(children);

  useEffect(() => {
    if (open) {
      lastChildrenRef.current = children;
    }
  }, [open, children]);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return;
    }

    if (!rendered) {
      return;
    }

    setClosing(true);
    const timer = setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, EXIT_DURATION_MS);

    return () => clearTimeout(timer);
  }, [open, rendered]);

  if (!rendered) {
    return null;
  }

  // 닫히는 애니메이션 도중에는 부모가 즉시 비워버린 내용 대신 마지막으로 보이던 내용을 유지
  const content = open ? children : lastChildrenRef.current;

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end justify-center">
      <div
        className={cn(
          "absolute inset-0 bg-(--color-dim)",
          closing ? "animate-[sheet-dim-out_0.28s_ease-in]" : "animate-[sheet-dim-in_0.28s_ease-out]"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-10 w-full rounded-t-[1.75rem] bg-(--color-surface) pb-6 pt-2 shadow-(--shadow-sheet)",
          closing
            ? "animate-[sheet-slide-down_0.28s_cubic-bezier(0.7,0,0.84,0)]"
            : "animate-[sheet-slide-up_0.28s_cubic-bezier(0.16,1,0.3,1)]"
        )}
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-(--color-border-strong)" aria-hidden="true" />
        {content}
      </div>
    </div>
  );
}
