"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { COLLEGES, MBTI_AXES } from "@ui/공통/constants";

export interface ExploreFilters {
  departments: string[];
  /** 고른 MBTI 글자들(E·N·F…). 유형 16개가 아니라 축별로 고른다. */
  mbtiLetters: string[];
  hobbies: string[];
}

/** 참가자 목록에서 뽑아낸 선택지. mbtis는 실제로 있는 유형 전체(ENFP…)다. */
export interface ExploreOptions {
  departments: string[];
  mbtis: string[];
  hobbies: string[];
}

export const EMPTY_FILTERS: ExploreFilters = {
  departments: [],
  mbtiLetters: [],
  hobbies: [],
};

export function countFilters(filters: ExploreFilters) {
  return filters.departments.length + filters.mbtiLetters.length + filters.hobbies.length;
}

interface FilterSheetProps {
  filters: ExploreFilters;
  /** 아무도 없는 조건은 고를 수 없게 한다. */
  options: ExploreOptions;
  onApply: (next: ExploreFilters) => void;
  onClose: () => void;
}

type FilterKey = keyof ExploreFilters;

/**
 * 학과·MBTI는 따로 그린다. 여기는 선택지와 고른 값이 같은 모양이라 한 줄로
 * 늘어놔도 되는 것만 남는다.
 */
type FlatKey = "departments" | "hobbies";

const SECTIONS: { key: FlatKey; label: string }[] = [{ key: "hobbies", label: "취미" }];

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

  /*
   * MBTI는 한 축에 하나만 고른다. E와 I를 동시에 고르는 건 "둘 다 상관없다"는
   * 뜻인데 그건 아무것도 안 고른 것과 같아서, 두 번 눌러 같은 결과에 도달하는
   * 길을 아예 막는다. 온보딩의 MBTI 선택과도 동작이 같아진다.
   */
  const pickMbtiLetter = (letter: string) => {
    setDraft((current) => {
      const axis = MBTI_AXES.find(
        (item) => item.top.code === letter || item.bottom.code === letter,
      );
      if (!axis) return current;

      const otherAxes = current.mbtiLetters.filter(
        (item) => item !== axis.top.code && item !== axis.bottom.code,
      );

      return {
        ...current,
        mbtiLetters: current.mbtiLetters.includes(letter)
          ? otherAxes
          : [...otherAxes, letter],
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
        {options.departments.length === 0 ? null : (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-(--color-text-strong)">학과</h3>
            <DepartmentFilter
              available={options.departments}
              picked={draft.departments}
              onToggle={(value) => toggle("departments", value)}
            />
          </section>
        )}

        {options.mbtis.length === 0 ? null : (
          <section className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-bold text-(--color-text-strong)">MBTI</h3>
              <p className="mt-0.5 text-[12px] text-(--color-text-sub)">
                고르지 않은 줄은 상관없이 다 찾아요
              </p>
            </div>
            <MbtiFilter
              availableTypes={options.mbtis}
              picked={draft.mbtiLetters}
              onToggle={pickMbtiLetter}
            />
          </section>
        )}

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

/**
 * 학부를 먼저 고르고 그 안의 학과를 고르는 2단 선택. 마이페이지·온보딩의
 * DepartmentPicker와 같은 조작감을 쓰되, 이쪽은 여러 개를 고를 수 있다.
 *
 * 30개를 한 줄에 늘어놓으면 시트가 스크롤로 가득 차서, 아래에 있는 MBTI·취미가
 * 있는 줄도 모르고 지나간다.
 */
function DepartmentFilter({
  available,
  picked,
  onToggle,
}: {
  /** 실제로 참가자가 있는 학과만. 아무도 없는 학과를 골라 "0명"을 보는 일이 없게 한다. */
  available: string[];
  picked: string[];
  onToggle: (value: string) => void;
}) {
  const groups = buildGroups(available);
  const [openCollege, setOpenCollege] = useState<string | null>(
    () => groups.find((group) => group.majors.some((major) => picked.includes(major)))?.name ?? null,
  );

  const openMajors = groups.find((group) => group.name === openCollege)?.majors;

  return (
    <div className="flex flex-col gap-2">
      {/* 학부는 고르는 게 아니라 펼치는 버튼이라, 채우지 않고 테두리만 준다. */}
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => {
          const isOpen = group.name === openCollege;
          const count = group.majors.filter((major) => picked.includes(major)).length;

          return (
            <button
              key={group.name}
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenCollege(isOpen ? null : group.name)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                isOpen
                  ? "border border-(--color-primary) bg-(--color-surface) font-bold text-(--color-primary)"
                  : "border border-(--color-border) bg-(--color-surface) font-medium text-(--color-text-sub)"
              }`}
            >
              {group.name}
              {count > 0 ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-primary) px-1 text-[10px] font-bold text-(--color-text-on-primary)">
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {openMajors ? (
        <div className="flex flex-wrap gap-2 rounded-(--radius-md) bg-(--color-surface-alt) p-2.5">
          {openMajors.map((major) => {
            const selected = picked.includes(major);

            return (
              <button
                key={major}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggle(major)}
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
    </div>
  );
}

/**
 * 참가자가 있는 학과만 학부별로 묶는다.
 *
 * 학과 정본(COLLEGES)에 없는 값도 들어올 수 있다 — 백엔드가 학과 검증을
 * 붙이기 전에 자유 입력으로 저장된 프로필이 남아 있다. 그런 값을 버리면
 * 그 사람들은 학과로 아예 찾을 수 없게 되므로 "기타"로 모아 둔다.
 */
function buildGroups(available: string[]) {
  const groups = COLLEGES.map((college) => ({
    name: college.name,
    majors: college.majors.filter((major) => available.includes(major)),
  })).filter((group) => group.majors.length > 0);

  const known = new Set<string>(groups.flatMap((group) => group.majors));
  const rest = available.filter((major) => !known.has(major));

  return rest.length > 0 ? [...groups, { name: "기타", majors: rest }] : groups;
}

/**
 * MBTI를 유형 16개가 아니라 4축으로 고른다.
 *
 * 온보딩(ProfileMbtiScreen)과 같은 2행 4열 배치를 쓰되, 거기서는 네 칸을 다
 * 채워 유형 하나를 만들고 여기서는 축마다 따로 고른다. 필터로 유형 하나를
 * 정확히 찍으면 300명이어도 스무 명 남짓만 남고, 결과를 보려고 네 번을
 * 눌러야 한다. "외향적인 사람"처럼 한 축만 보고 싶은 게 보통이다.
 *
 * 한 줄에서는 하나만 골라진다 — 다른 쪽을 누르면 바뀐다.
 */
function MbtiFilter({
  availableTypes,
  picked,
  onToggle,
}: {
  availableTypes: string[];
  picked: string[];
  onToggle: (letter: string) => void;
}) {
  // 아무도 해당하지 않는 글자는 눌러도 0명이라 잠근다. 칸을 지우지는 않는다 —
  // 4열 격자가 어긋나 어느 축인지 못 읽는다.
  const availableLetters = new Set(
    availableTypes.flatMap((type) => [...type]),
  );

  const cell = (option: { code: string; label: string }) => {
    const selected = picked.includes(option.code);
    const usable = availableLetters.has(option.code);

    return (
      <button
        key={option.code}
        type="button"
        disabled={!usable}
        aria-pressed={selected}
        aria-label={`${option.code} ${option.label}`}
        onClick={() => onToggle(option.code)}
        className={`flex flex-col items-center gap-0.5 rounded-(--radius-md) py-3 transition-colors ${
          selected
            ? "bg-(--color-primary) text-(--color-text-on-primary)"
            : usable
              ? "bg-(--color-surface-alt) text-(--color-text-sub)"
              : "bg-(--color-surface-alt) text-(--color-disabled-text)"
        }`}
      >
        <span className="text-[20px] font-bold leading-none">{option.code}</span>
        <span className="text-[10px]">{option.label}</span>
      </button>
    );
  };

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {MBTI_AXES.map((axis) => cell(axis.top))}
      {MBTI_AXES.map((axis) => cell(axis.bottom))}
    </div>
  );
}
