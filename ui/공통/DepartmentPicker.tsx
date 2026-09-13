"use client";

import { useState } from "react";
import { COLLEGES } from "./constants";

interface DepartmentPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

const collegeOf = (major: string) =>
  COLLEGES.find((college) => college.majors.some((name) => name === major))?.name ??
  null;

/** 학부를 먼저 고르고, 그 학부의 학과 중에서 하나를 고르는 2단 선택 */
export function DepartmentPicker({ label, value, onChange }: DepartmentPickerProps) {
  const [pickedCollege, setPickedCollege] = useState<string | null>(null);
  // 저장된 학과를 나중에 불러오는 화면(마이페이지)에서도 해당 학부가 펼쳐지도록
  const openCollege = pickedCollege ?? collegeOf(value);
  const majors = COLLEGES.find((college) => college.name === openCollege)?.majors;

  return (
    <div>
      {label ? (
        <p className="mb-1.5 text-[11px] font-bold text-(--color-text-sub)">
          {label}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {COLLEGES.map((college) => {
          const isOpen = college.name === openCollege;

          return (
            <button
              key={college.name}
              type="button"
              aria-pressed={isOpen}
              onClick={() => setPickedCollege(college.name)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                isOpen
                  ? "border border-(--color-primary) bg-(--color-surface) font-bold text-(--color-primary)"
                  : "border border-(--color-border) bg-(--color-surface) font-medium text-(--color-text-sub)"
              }`}
            >
              {college.name}
            </button>
          );
        })}
      </div>

      {majors ? (
        <div className="mt-2 flex flex-wrap gap-2 rounded-(--radius-md) bg-(--color-surface-alt) p-2.5">
          {majors.map((major) => {
            const selected = major === value;

            return (
              <button
                key={major}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(selected ? "" : major)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? "bg-(--color-primary) font-bold text-(--color-text-on-primary)"
                    : "bg-(--color-surface) font-medium text-(--color-text-sub)"
                }`}
              >
                {major}
              </button>
            );
          })}
        </div>
      ) : null}

      {value ? (
        <p className="mt-2 text-[12px] text-(--color-text-sub)">
          선택한 학과 · <span className="font-bold">{value}</span>
        </p>
      ) : null}
    </div>
  );
}
