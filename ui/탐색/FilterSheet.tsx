"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { MBTI_AXES } from "@ui/공통/constants";
import type { DepartmentGroup } from "@ui/프로필작성/profileApi";
import { track } from "@ui/공통/analytics";

export interface ExploreFilters {
  departments: string[];
  /** 고른 MBTI 글자들(E·N·F…). 유형 16개가 아니라 축별로 고른다. */
  mbtiLetters: string[];
  hobbies: string[];
  /** 고른 성별. 둘 다 고르거나 아무것도 안 고르면 전체와 같다. */
  genders: string[];
  /** [최소, 최대] 나이. 참가자 전체를 덮는 범위면 안 고른 것으로 친다. */
  ageRange: [number, number];
}

/** 참가자 목록에서 뽑아낸 선택지. mbtis는 실제로 있는 유형 전체(ENFP…)다. */
export interface ExploreOptions {
  departments: string[];
  mbtis: string[];
  hobbies: string[];
  genders: string[];
  /** 실제 참가자의 나이 하한·상한. 슬라이더의 양 끝이 된다. */
  ageBounds: [number, number];
}

/**
 * 나이 슬라이더의 최소 눈금.
 *
 * 대학 축제 부스라 미성년자가 올 일이 없고, 18~19가 눈금에 남아 있으면
 * 아무도 없는 구간을 드래그하게 된다.
 */
export const MIN_AGE = 20;

export const EMPTY_FILTERS: ExploreFilters = {
  departments: [],
  mbtiLetters: [],
  hobbies: [],
  genders: [],
  // 실제 범위는 참가자를 받아본 뒤에 정해진다(withAgeBounds).
  ageRange: [MIN_AGE, MIN_AGE],
};

/**
 * 조건을 몇 개 걸었는지. 나이는 양 끝을 건드렸을 때만 1로 센다 — 전체 범위는
 * 조건을 안 건 것과 결과가 같은데 배지에 숫자가 뜨면 왜 줄었는지 찾게 된다.
 */
export function countFilters(filters: ExploreFilters, bounds?: [number, number]) {
  const ageNarrowed =
    bounds !== undefined &&
    (filters.ageRange[0] > bounds[0] || filters.ageRange[1] < bounds[1]);

  return (
    filters.departments.length +
    filters.mbtiLetters.length +
    filters.hobbies.length +
    filters.genders.length +
    (ageNarrowed ? 1 : 0)
  );
}

/** 참가자를 받아 실제 나이 범위를 알게 됐을 때 필터의 기본값을 맞춘다. */
export function withAgeBounds(
  filters: ExploreFilters,
  [low, high]: [number, number],
): ExploreFilters {
  return {
    ...filters,
    ageRange: [Math.max(filters.ageRange[0], low), Math.max(filters.ageRange[1], high)],
  };
}

interface FilterSheetProps {
  filters: ExploreFilters;
  /** 아무도 없는 조건은 고를 수 없게 한다. */
  options: ExploreOptions;
  /** 학부→학과 묶음(GET /api/departments). 아직 못 받았으면 null. */
  departmentGroups: DepartmentGroup[] | null;
  onApply: (next: ExploreFilters) => void;
  onClose: () => void;
}

/** 문자열 여러 개를 담는 필드만. 나이는 모양이 달라 따로 다룬다. */
type FilterKey = "departments" | "mbtiLetters" | "hobbies" | "genders";

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
export function FilterSheet({
  filters,
  options,
  departmentGroups,
  onApply,
  onClose,
}: FilterSheetProps) {
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

  const picked = countFilters(draft, options.ageBounds);

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
        {options.genders.length < 2 ? null : (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-(--color-text-strong)">성별</h3>
            <div className="flex gap-2">
              {options.genders.map((value) => {
                const active = draft.genders.includes(value);

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle("genders", value)}
                    className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors ${
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
        )}

        {options.ageBounds[0] >= options.ageBounds[1] ? null : (
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-bold text-(--color-text-strong)">나이</h3>
              <span className="text-sm font-bold text-(--color-primary) tabular-nums">
                {draft.ageRange[0]}~{draft.ageRange[1]}세
              </span>
            </div>
            <AgeRangeSlider
              bounds={options.ageBounds}
              value={draft.ageRange}
              onChange={(ageRange) => setDraft((current) => ({ ...current, ageRange }))}
            />
          </section>
        )}

        {options.departments.length === 0 ? null : (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-(--color-text-strong)">학과</h3>
            <DepartmentFilter
              groups={departmentGroups}
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
          onClick={() =>
            setDraft({ ...EMPTY_FILTERS, ageRange: options.ageBounds })
          }
          disabled={picked === 0}
          className="rounded-(--radius-lg) bg-(--color-surface-alt) px-6 py-3.5 text-sm font-bold text-(--color-text-sub) disabled:text-(--color-disabled-text)"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={() => {
            track({
              name: "explore_filter_applied",
              props: { count: countFilters(draft, options.ageBounds) },
            });
            onApply(draft);
          }}
          className="flex-1 rounded-(--radius-lg) bg-(--color-accent) py-3.5 text-base font-bold text-(--color-text-on-primary)"
        >
          {picked > 0 ? `${picked}개 조건으로 보기` : "전체 보기"}
        </button>
      </div>
    </div>
  );
}

/**
 * 나이 범위를 양 끝에서 좁히는 슬라이더.
 *
 * range 입력 두 개를 겹쳐 쓴다. 손잡이 두 개짜리 표준 입력이 없어서 흔히
 * 쓰는 방법이고, 키보드와 보조기술에서도 각각 하나의 슬라이더로 읽힌다.
 *
 * 두 손잡이가 서로를 지나치지 못하게 min/max를 상대 값으로 묶는다 —
 * 지나치게 두면 "26~22세" 같은 뒤집힌 범위가 나와서 결과가 0명이 된다.
 */
function AgeRangeSlider({
  bounds: [low, high],
  value: [from, to],
  onChange,
}: {
  bounds: [number, number];
  value: [number, number];
  onChange: (next: [number, number]) => void;
}) {
  const span = high - low;
  const leftPercent = ((from - low) / span) * 100;
  const rightPercent = ((to - low) / span) * 100;

  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-6">
        {/* 전체 구간 */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-(--color-primary-lighter)" />
        {/* 고른 구간 */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-(--color-primary)"
          style={{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }}
        />
        <input
          type="range"
          min={low}
          max={to}
          value={from}
          aria-label="최소 나이"
          onChange={(event) => onChange([Number(event.target.value), to])}
          className="age-slider absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          min={from}
          max={high}
          value={to}
          aria-label="최대 나이"
          onChange={(event) => onChange([from, Number(event.target.value)])}
          className="age-slider absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent"
        />
      </div>
      <div className="flex justify-between text-[12px] text-(--color-text-muted) tabular-nums">
        <span>{low}세</span>
        <span>{high}세</span>
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
  groups: source,
  available,
  picked,
  onToggle,
}: {
  groups: DepartmentGroup[] | null;
  /** 실제로 참가자가 있는 학과만. 아무도 없는 학과를 골라 "0명"을 보는 일이 없게 한다. */
  available: string[];
  picked: string[];
  onToggle: (value: string) => void;
}) {
  const groups = buildGroups(available, source);
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
 * 학부 정본은 백엔드(GET /api/departments)다. 아직 못 받았으면 묶지 않고 한
 * 덩어리로 내놓는다 — 목록을 못 받았다고 학과 필터를 통째로 막을 이유는 없다.
 *
 * 정본에 없는 학과도 들어올 수 있다. 백엔드가 학과 검증을 붙이기 전에 자유
 * 입력으로 저장된 프로필이 남아 있는데, 버리면 그 사람들은 학과로 아예 찾을
 * 수 없게 되므로 "기타"로 모아 둔다.
 */
function buildGroups(available: string[], source: DepartmentGroup[] | null) {
  if (!source) {
    return [{ name: "전체", majors: available }];
  }

  const groups = source
    .map((college) => ({
      name: college.college,
      majors: college.majors.filter((major) => available.includes(major)),
    }))
    .filter((group) => group.majors.length > 0);

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
