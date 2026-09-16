"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  type DepartmentGroup,
  getDepartments,
  profileErrorMessage,
} from "@ui/프로필작성/profileApi";
import { BottomSheet } from "./BottomSheet";

interface DepartmentPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * 학부를 먼저 고르고, 그 학부의 학과 중에서 하나를 고르는 2단 선택.
 *
 * 화면에는 고른 학과 한 줄만 두고 고르는 일은 바텀시트에서 한다. 학부가
 * 일곱이라 칩으로 늘어놓으면 세 줄이 되고 그 아래 학과 트레이가 또 붙어서,
 * 이 항목 하나가 화면 절반을 먹는다. 학부가 더 늘어도 높이가 그대로다.
 *
 * 시트 안에서는 학부와 학과를 좌우로 나눈다. 둘 다 알약으로 늘어놓으면
 * 모양이 같아서 어느 쪽이 상위인지가 색 하나에만 걸린다.
 *
 * 학과 목록은 백엔드 `GET /api/departments`가 정본이라 하드코딩하지 않고
 * 마운트할 때 받아온다 — 예전엔 이 목록이 여기와 백엔드에 각각
 * 하드코딩돼 있어서 한쪽만 바뀌면 조용히 어긋났다.
 */
export function DepartmentPicker({ label, value, onChange }: DepartmentPickerProps) {
  const [groups, setGroups] = useState<DepartmentGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
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

  // 저장된 학과를 나중에 불러오는 화면(마이페이지)에서도 해당 학부가 펼쳐지도록
  const openCollege =
    pickedCollege ??
    groups?.find((college) => college.majors.some((major) => major === value))
      ?.college ??
    groups?.[0]?.college ??
    null;
  const majors = groups?.find((college) => college.college === openCollege)?.majors;

  const pickMajor = (major: string) => {
    onChange(major === value ? "" : major);
    setOpen(false);
  };

  return (
    <div>
      {label ? (
        <p className="mb-1.5 text-[11px] font-bold text-(--color-text-sub)">
          {label}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!groups}
        onClick={() => setOpen(true)}
        className="flex h-[50px] w-full items-center gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-alt) px-4 text-left text-[14px] disabled:opacity-60"
      >
        <span
          className={`flex-1 truncate ${
            value ? "text-(--color-text-strong)" : "text-(--color-text-muted)"
          }`}
        >
          {groups ? value || "학과를 골라주세요" : "학과 목록을 불러오는 중..."}
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-(--color-text-muted)" />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <div className="px-5 pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-bold text-(--color-text-strong)">
              학과를 골라주세요
            </h2>
            {value ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="shrink-0 text-[12px] font-bold text-(--color-text-sub)"
              >
                선택 해제
              </button>
            ) : null}
          </div>
        </div>

        {/*
          좌우 높이를 고정하고 각자 스크롤시킨다. 한쪽이 길다고 시트 전체가
          늘어나면 학부가 많은 쪽을 고를 때마다 시트 높이가 널뛴다.
        */}
        <div className="mt-3 flex h-[320px] border-t border-(--color-border)">
          <div className="w-[44%] overflow-y-auto border-r border-(--color-border) bg-(--color-surface-alt)">
            {groups?.map((college) => {
              const isOpen = college.college === openCollege;

              return (
                <button
                  key={college.college}
                  type="button"
                  aria-pressed={isOpen}
                  onClick={() => setPickedCollege(college.college)}
                  /* 누르는 순간 색이 들어와야 먹혔는지 안다 — 목록은 누른 자리가 바로 안 바뀌는 경우가 있다. */
                  className={`block w-full border-l-[3px] px-3 py-3.5 text-left text-[13px] font-bold transition-colors active:bg-(--color-primary-light) ${
                    isOpen
                      ? "border-(--color-primary) bg-(--color-surface) text-(--color-primary)"
                      : "border-transparent text-(--color-text-sub)"
                  }`}
                >
                  {college.college}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto">
            {majors?.map((major) => {
              const selected = major === value;

              return (
                <button
                  key={major}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => pickMajor(major)}
                  /* 고르면 시트가 바로 닫히므로, 닫히기 전에 눌린 자리를 한 번 보여준다. */
                  className={`flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left text-[14px] transition-colors active:bg-(--color-primary-light) ${
                    selected
                      ? "font-bold text-(--color-primary)"
                      : "text-(--color-text-strong)"
                  }`}
                >
                  {major}
                  {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
