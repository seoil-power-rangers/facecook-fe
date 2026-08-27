"use client";

import type { ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end justify-center">
      <div className="absolute inset-0 bg-(--color-dim)" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full rounded-t-[1.75rem] bg-(--color-surface) pb-6 pt-2 shadow-(--shadow-sheet)">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-(--color-border-strong)" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
