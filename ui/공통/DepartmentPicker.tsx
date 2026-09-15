"use client";

import { useEffect, useState } from "react";
import {
  type DepartmentGroup,
  getDepartments,
  profileErrorMessage,
} from "@ui/프로필작성/profileApi";

interface DepartmentPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * 학부를 먼저 고르고, 그 학부의 학과 중에서 하나를 고르는 2단 선택.
 *
 * 학과 목록은 백엔드 `GET /api/departments`가 정본이라 하드코딩하지 않고
 * 마운트할 때 받아온다 — 예전엔 이 목록이 여기와 백엔드에 각각
 * 하드코딩돼 있어서 한쪽만 바뀌면 조용히 어긋났다.
 */
export function DepartmentPicker({ label, value, onChange }: DepartmentPickerProps) {
  const [groups, setGroups] = useState<DepartmentGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickedCollege, setPickedCollege] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDepartments()
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .catch((fetchError) => {
        if (!cancelled) setError(profileErrorMessage(fetchError));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="text-[12px] text-(--color-danger)">
        학과 목록을 불러오지 못했어요. {error}
      </p>
    );
  }

  if (!groups) {
    return (
      <p className="text-[12px] text-(--color-text-sub)">학과 목록을 불러오는 중...</p>
    );
  }

  // 저장된 학과를 나중에 불러오는 화면(마이페이지)에서도 해당 학부가 펼쳐지도록
  const openCollege =
    pickedCollege ??
    groups.find((college) => college.majors.some((major) => major === value))?.college ??
    null;
  const majors = groups.find((college) => college.college === openCollege)?.majors;

  return (
    <div>
      {label ? (
        <p className="mb-1.5 text-[11px] font-bold text-(--color-text-sub)">
          {label}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {groups.map((college) => {
          const isOpen = college.college === openCollege;

          return (
            <button
              key={college.college}
              type="button"
              aria-pressed={isOpen}
              onClick={() => setPickedCollege(college.college)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                isOpen
                  ? "border border-(--color-primary) bg-(--color-surface) font-bold text-(--color-primary)"
                  : "border border-(--color-border) bg-(--color-surface) font-medium text-(--color-text-sub)"
              }`}
            >
              {college.college}
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
