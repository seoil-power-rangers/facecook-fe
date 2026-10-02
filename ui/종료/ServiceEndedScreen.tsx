"use client";

import { useEffect, useState } from "react";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Textarea } from "@ui/공통/Textarea";
import { clearSession } from "@ui/공통/session";
import { ENDING_MESSAGE, FEEDBACK_MAX_LENGTH } from "./endingContent";
import { feedbackErrorMessage, submitFeedback } from "./feedbackApi";

/** 이 브라우저에서 후기를 보냈는지. 다시 열어도 입력창 대신 감사 문구를 보여 준다. */
const SENT_KEY = "facecook:feedbackSent";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "sent" }
  | { status: "failed"; message: string };

/**
 * 서비스 종료 화면(facecook-fe#127). 종료 시각 이후에는 어느 주소로 들어와도 이 화면이 나온다(`src/proxy.ts`).
 * 로그인 화면의 로고와 배경을 그대로 쓰고, 운영진 인사말과 익명 후기 입력창을 보여 준다.
 * 후기 목록은 보여 주지 않는다.
 */
export function ServiceEndedScreen() {
  const [content, setContent] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  useEffect(() => {
    // 로그인 이름표가 남아 있으면 종료 뒤 다시 열었을 때 쓸모없는 상태가 남는다. 쿠키는 BE가 더는 받지 않는다.
    clearSession();
    try {
      // localStorage는 서버 렌더에 없어서(하이드레이션 불일치) 마운트 뒤에 읽는다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(SENT_KEY)) setState({ status: "sent" });
    } catch {
      // 저장소가 막힌 브라우저면 입력창을 그대로 보여 준다.
    }
  }, []);

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && content.length <= FEEDBACK_MAX_LENGTH && state.status !== "submitting";

  const submit = async () => {
    if (!canSubmit) return;
    setState({ status: "submitting" });
    try {
      await submitFeedback(trimmed);
      try {
        localStorage.setItem(SENT_KEY, "1");
      } catch {
        // 저장이 막혀도 이번 화면에서는 보낸 상태로 보여 준다.
      }
      setContent("");
      setState({ status: "sent" });
    } catch (error) {
      setState({ status: "failed", message: feedbackErrorMessage(error) });
    }
  };

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col bg-(--color-primary-lighter)">
        <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-10 pt-10">
          <AppMark />

          <section className="mt-8 rounded-(--radius-lg) bg-(--color-surface) px-5 py-6 shadow-(--shadow-card)">
            <h1 className="text-[18px] font-bold text-(--color-text-strong)">{ENDING_MESSAGE.title}</h1>
            <div className="mt-3 space-y-2 text-[14px] leading-relaxed text-(--color-text-sub)">
              {ENDING_MESSAGE.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className="mt-4 text-right text-[13px] font-semibold text-(--color-text-sub)">
              {ENDING_MESSAGE.signature}
            </p>
          </section>

          <section className="mt-6 rounded-(--radius-lg) bg-(--color-surface) px-5 py-6 shadow-(--shadow-card)">
            {state.status === "sent" ? (
              <div className="text-center">
                <p className="text-[16px] font-bold text-(--color-text-strong)">후기를 보내 주셔서 고마워요</p>
                <p className="mt-2 text-[13px] text-(--color-text-sub)">남겨 주신 이야기는 운영진이 꼭 읽어 볼게요.</p>
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit();
                }}
              >
                <h2 className="text-[16px] font-bold text-(--color-text-strong)">후기를 남겨 주세요</h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-(--color-text-sub)">
                  익명으로 저장되고 운영진만 읽어요. 이름·연락처 같은 개인정보는 적지 말아 주세요.
                </p>
                <div className="mt-4">
                  <Textarea
                    aria-label="후기"
                    rows={5}
                    maxLength={FEEDBACK_MAX_LENGTH}
                    placeholder="좋았던 점, 아쉬웠던 점을 자유롭게 적어 주세요."
                    value={content}
                    onChange={(event) => {
                      setContent(event.target.value);
                      if (state.status === "failed") setState({ status: "idle" });
                    }}
                  />
                  <p className="mt-1 text-right text-[12px] text-(--color-text-muted)">
                    {content.length}/{FEEDBACK_MAX_LENGTH}
                  </p>
                </div>
                {state.status === "failed" ? (
                  <div className="mt-3">
                    <InfoBox tone="danger" icon={null}>
                      {state.message}
                    </InfoBox>
                  </div>
                ) : null}
                <div className="mt-4">
                  <Button type="submit" fullWidth disabled={!canSubmit}>
                    {state.status === "submitting" ? "보내는 중..." : "후기 보내기"}
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </PhoneFrame>
  );
}

/** 로그인 화면과 같은 앱 아이콘 + 워드마크. */
function AppMark() {
  return (
    <div className="flex flex-col items-center">
      <div className="overflow-hidden rounded-[1.75rem] bg-(--color-surface) p-2 shadow-(--shadow-card)">
        {/* 정적 파일이라 next/image의 최적화가 필요 없다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="콕찔러보기" className="h-20 w-20 rounded-[1.25rem] object-contain" />
      </div>
      <p className="mt-4 text-[26px] font-bold leading-none tracking-tight text-(--color-text-strong)">
        <span className="text-(--color-accent)">콕</span>찔러보기
      </p>
    </div>
  );
}
