"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "./cn";

interface ToastProps {
  open: boolean;
  message: string;
  onClick?: () => void;
  onDismiss: () => void;
  autoHideMs?: number;
}

// toast-out 애니메이션 길이와 맞춰야 언마운트 전에 재생이 끝남
const EXIT_DURATION_MS = 220;
const DEFAULT_AUTO_HIDE_MS = 4000;

export function Toast({ open, message, onClick, onDismiss, autoHideMs = DEFAULT_AUTO_HIDE_MS }: ToastProps) {
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const lastMessageRef = useRef(message);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (open) {
      lastMessageRef.current = message;
    }
  }, [open, message]);

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

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = setTimeout(() => onDismissRef.current(), autoHideMs);
    return () => clearTimeout(timer);
  }, [open, autoHideMs]);

  if (!rendered) {
    return null;
  }

  const content = open ? message : lastMessageRef.current;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex max-w-[430px] justify-center px-4 pt-4">
      <button
        type="button"
        onClick={() => {
          onClick?.();
          onDismiss();
        }}
        className={cn(
          "pointer-events-auto w-full rounded-(--radius-lg) bg-(--color-surface) px-4 py-3 text-left shadow-(--shadow-card) ring-1 ring-(--color-border)",
          closing ? "animate-[toast-out_0.22s_ease-in]" : "animate-[toast-in_0.28s_cubic-bezier(0.16,1,0.3,1)]"
        )}
      >
        <p className="text-sm font-medium text-(--color-text-strong)">{content}</p>
      </button>
    </div>
  );
}
