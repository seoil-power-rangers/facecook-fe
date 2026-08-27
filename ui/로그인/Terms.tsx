"use client";

import { useRouter } from "next/navigation";
import Button from "@ui/공통/Button";
import CheckRow from "@ui/공통/CheckRow";
import StepHeader, { Accent } from "@ui/공통/StepHeader";
import InfoBox from "@ui/공통/InfoBox";
import { ChevronRight } from "@ui/공통/icons";
import { EVENT, TERMS } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

const REQUIRED = TERMS.filter((t) => t.required).map((t) => t.id);

/** 03-terms (STEP 2) — 필수 2 + 선택 1 */
export default function Terms() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const agreed = draft.agreedTerms;

  const allOn = agreed.length === TERMS.length;
  const canSubmit = REQUIRED.every((id) => agreed.includes(id));

  const toggle = (id: string) =>
    update((d) => ({
      ...d,
      agreedTerms: d.agreedTerms.includes(id)
        ? d.agreedTerms.filter((v) => v !== id)
        : [...d.agreedTerms, id],
    }));

  const toggleAll = () =>
    update((d) => ({
      ...d,
      agreedTerms:
        d.agreedTerms.length === TERMS.length ? [] : TERMS.map((t) => t.id),
    }));

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        step={2}
        title={
          <>
            <Accent>약관</Accent>에 동의해주세요
          </>
        }
      />

      <div className="rounded-xl bg-primary-soft px-3.5 py-1">
        <CheckRow checked={allOn} onToggle={toggleAll} label="전체 동의">
          <b className={`font-bold ${allOn ? "text-primary" : "text-muted"}`}>
            전체 동의
          </b>
        </CheckRow>
      </div>

      <div className="mt-3 space-y-0.5 px-1">
        {TERMS.map((t) => (
          <CheckRow
            key={t.id}
            checked={agreed.includes(t.id)}
            onToggle={() => toggle(t.id)}
            label={`${t.required ? "필수" : "선택"} ${t.label} 동의`}
            trailing={
              <button
                type="button"
                aria-label={`${t.label} 전문 보기`}
                className="h-4 w-4 shrink-0 text-line"
              >
                <ChevronRight />
              </button>
            }
          >
            <b className="font-bold text-primary">
              [{t.required ? "필수" : "선택"}]
            </b>{" "}
            {t.label}
          </CheckRow>
        ))}
      </div>

      <div className="mt-5">
        <InfoBox icon={null}>
          <b className="mb-1 block font-bold text-ink">데이터 보관 안내</b>
          프로필·콕 기록은 매일 초기화돼요.
          <br />
          모든 데이터는 {EVENT.purgeAt}에 삭제됩니다.
        </InfoBox>
      </div>

      <div className="mt-auto pt-8">
        <Button
          disabled={!canSubmit}
          onClick={() => router.push("/onboarding/basic")}
        >
          동의하고 계속
        </Button>
      </div>
    </div>
  );
}
