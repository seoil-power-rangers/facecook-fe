"use client";

import { useState } from "react";
import { GRADES } from "@ui/공통/constants";
import { DepartmentPicker } from "@ui/공통/DepartmentPicker";
import type { ProfileResponse } from "@ui/프로필작성/profileApi";

export interface ProfileEdit {
  department: string;
  grade: string;
  bio: string;
}

/**
 * 마이페이지의 프로필 수정.
 *
 * 기능명세 2절에서 수정 가능한 건 학과·학년·자기소개뿐이다. 닉네임·나이·
 * MBTI·취미·혈액형은 최초 등록 후 바꿀 수 없어서 여기 두지 않는다 —
 * 입력칸을 보여주고 저장이 안 되는 것보다 아예 없는 게 낫다.
 */
export function ProfileEditSheet({
  profile,
  isSubmitting,
  error,
  onSave,
  onCancel,
}: {
  profile: ProfileResponse;
  isSubmitting: boolean;
  error: string | null;
  onSave: (edit: ProfileEdit) => void;
  onCancel: () => void;
}) {
  const [department, setDepartment] = useState(profile.department ?? "");
  const [grade, setGrade] = useState(profile.grade ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");

  return (
    <div className="flex max-h-[75vh] flex-col">
      <div className="shrink-0 px-5 pb-4 pt-2">
        <h2 className="text-lg font-bold text-(--color-text-strong)">프로필 수정</h2>
        <p className="mt-0.5 text-[13px] text-(--color-text-sub)">
          닉네임·나이·MBTI·취미는 처음 등록한 그대로 유지돼요
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-4">
        {/*
          자유 입력이면 "컴공"·"컴퓨터 공학과"처럼 표기가 갈려서 탐색 화면의
          학과 필터가 문자열 비교에서 못 걸러낸다. 온보딩과 같은 선택기를 쓴다.
        */}
        <DepartmentPicker label="학과" value={department} onChange={setDepartment} />

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-(--color-text-sub)">학년</span>
          <div className="flex gap-2">
            {GRADES.map((option) => {
              const active = grade === option;

              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setGrade(active ? "" : option)}
                  className={`flex-1 rounded-(--radius-lg) py-3 text-sm font-bold transition-colors ${
                    active
                      ? "bg-(--color-primary) text-(--color-text-on-primary)"
                      : "bg-(--color-surface-alt) text-(--color-text-sub)"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-(--color-text-sub)">한 마디</span>
          {/* 16px 미만으로 줄이지 말 것 — iOS가 포커스 시 화면을 확대한다. */}
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={3}
            maxLength={60}
            placeholder="부스에서 만나면 이렇게 인사해주세요"
            className="resize-none rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-alt) px-4 py-3 text-base leading-relaxed text-(--color-text-strong) outline-none placeholder:text-(--color-text-muted)"
          />
          <span className="self-end text-xs text-(--color-text-muted) tabular-nums">
            {bio.length} / 60
          </span>
        </label>

        {error ? (
          <p role="alert" className="text-[13px] text-(--color-danger)">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-3 border-t border-(--color-border) px-5 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-(--radius-lg) bg-(--color-surface-alt) px-6 py-3.5 text-sm font-bold text-(--color-text-sub)"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => onSave({ department, grade, bio })}
          disabled={isSubmitting}
          className="flex-1 rounded-(--radius-lg) bg-(--color-primary) py-3.5 text-base font-bold text-(--color-text-on-primary) disabled:bg-(--color-disabled-bg) disabled:text-(--color-disabled-text)"
        >
          {isSubmitting ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}
