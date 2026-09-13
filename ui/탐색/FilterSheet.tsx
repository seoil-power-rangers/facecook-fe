"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface ExploreFilters {
  departments: string[];
  mbtis: string[];
  hobbies: string[];
}

export const EMPTY_FILTERS: ExploreFilters = {
  departments: [],
  mbtis: [],
  hobbies: [],
};

export function countFilters(filters: ExploreFilters) {
  return filters.departments.length + filters.mbtis.length + filters.hobbies.length;
}

interface FilterSheetProps {
  filters: ExploreFilters;
  /** 참가자 목록에서 뽑아낸 선택지. 아무도 없는 조건은 아예 보여주지 않는다. */
  options: ExploreFilters;
  onApply: (next: ExploreFilters) => void;
  onClose: () => void;
}

type FilterKey = keyof ExploreFilters;

const SECTIONS: { key: FilterKey; label: string }[] = [
  { key: "departments", label: "학과" },
  { key: "mbtis", label: "MBTI" },
  { key: "hobbies", label: "취미" },
];

/**
 * 탐색 화면의 필터.
 *
 * 고른 걸 바로 적용하지 않고 [적용하기]를 눌러야 반영한다 — 뒤에서 목록이
 * 실시간으로 줄어들면 무엇 때문에 줄었는지 알기 어렵고, 조건 서너 개를
 * 고르는 동안 화면이 계속 흔들린다.
 */
export function FilterSheet({ filters, options, onApply, onClose }: FilterSheetProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    // 시트를 다시 열면 지금 적용된 조건에서 시작한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(filters);
  }, [filters]);

  const toggle = (key: FilterKey, value: string) => {
    setDraft((current) => {
      const picked = current[key];
      return {
        ...current,
        [key]: picked.includes(value)
          ? picked.filter((item) => item !== value)
          : [...picked, value],
      };
    });
  };

  const picked = countFilters(draft);

  return (
    <div className="flex max-h-[75vh] flex-col">
      <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-2">
        <h2 className="text-lg font-bold text-(--color-text-strong)">필터</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="필터 닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-surface-alt) text-(--color-text-sub)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 pb-4">
        {SECTIONS.map(({ key, label }) =>
          options[key].length === 0 ? null : (
            <section key={key} className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-(--color-text-strong)">{label}</h3>
              <div className="flex flex-wrap gap-2">
                {options[key].map((value) => {
                  const active = draft[key].includes(value);

                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(key, value)}
                      className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-(--color-primary) text-(--color-text-on-primary)"
                          : "bg-(--color-primary-lighter) text-(--color-text-body)"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </section>
          ),
        )}
      </div>

      <div className="flex shrink-0 gap-3 border-t border-(--color-border) px-5 pt-4">
        <button
          type="button"
          onClick={() => setDraft(EMPTY_FILTERS)}
          disabled={picked === 0}
          className="rounded-(--radius-lg) bg-(--color-surface-alt) px-6 py-3.5 text-sm font-bold text-(--color-text-sub) disabled:text-(--color-disabled-text)"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="flex-1 rounded-(--radius-lg) bg-(--color-accent) py-3.5 text-base font-bold text-(--color-text-on-primary)"
        >
          {picked > 0 ? `${picked}개 조건으로 보기` : "전체 보기"}
        </button>
      </div>
    </div>
  );
}
