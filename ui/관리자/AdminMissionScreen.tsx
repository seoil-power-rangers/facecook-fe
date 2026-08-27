"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { Button } from "@ui/공통/Button";
import { Tag } from "@ui/공통/Tag";
import { TextField } from "@ui/공통/TextField";
import { AdminShell } from "./AdminShell";
import {
  MISSION_LAST_STEP,
  MISSION_STEP_TITLES,
  adminMissions,
  type AdminMission,
} from "./admin.mock";

/**
 * 09 admin-mission — 부스에서 커플이 찾아오면 단계를 올려주는 화면.
 *
 * 완료 처리는 되돌리는 UI가 없다(스키마에 취소 개념이 없음). 그래서 버튼을
 * 누르면 바로 처리하지 않고 바텀시트로 한 번 확인받는다.
 */
export function AdminMissionScreen() {
  const [keyword, setKeyword] = useState("");
  const [missions, setMissions] = useState(adminMissions);
  const [target, setTarget] = useState<AdminMission | null>(null);

  const filtered = useMemo(() => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      return missions;
    }
    return missions.filter(
      (mission) =>
        mission.partnerA.includes(trimmed) || mission.partnerB.includes(trimmed),
    );
  }, [keyword, missions]);

  const confirmComplete = () => {
    if (!target) {
      return;
    }
    // 서버가 붙으면 여기서 mission_progress를 갱신한다.
    setMissions((prev) =>
      prev.map((mission) =>
        mission.matchId === target.matchId
          ? { ...mission, currentStep: mission.currentStep + 1 }
          : mission,
      ),
    );
    setTarget(null);
  };

  return (
    <AdminShell title="미션 완료 처리">
      <div className="flex flex-col gap-3 p-4">
        <TextField
          placeholder="닉네임으로 찾기"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          trailing={
            <Search className="h-5 w-5 shrink-0 text-(--color-text-muted)" />
          }
        />

        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-(--color-text-sub)">
            찾는 참가자가 없어요.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((mission) => (
              <MissionRow
                key={mission.matchId}
                mission={mission}
                onComplete={() => setTarget(mission)}
              />
            ))}
          </ul>
        )}
      </div>

      <BottomSheet open={target !== null} onClose={() => setTarget(null)}>
        {target ? (
          <div className="px-5 pt-3">
            <h2 className="text-[17px] font-bold text-(--color-text-strong)">
              STEP {target.currentStep} 완료로 처리할까요?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-(--color-text-body)">
              {target.partnerA} · {target.partnerB} 커플의 「
              {MISSION_STEP_TITLES[target.currentStep]}」를 완료 처리합니다.
            </p>
            <p className="mt-2 text-xs text-(--color-danger)">
              완료 처리는 되돌릴 수 없어요.
            </p>

            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setTarget(null)}
              >
                취소
              </Button>
              <Button fullWidth onClick={confirmComplete}>
                완료 처리
              </Button>
            </div>
          </div>
        ) : null}
      </BottomSheet>
    </AdminShell>
  );
}

function MissionRow({
  mission,
  onComplete,
}: {
  mission: AdminMission;
  onComplete: () => void;
}) {
  const cleared = mission.currentStep > MISSION_LAST_STEP;

  return (
    <li
      className={`rounded-(--radius-lg) bg-(--color-surface) p-3.5 shadow-(--shadow-card) ${
        cleared ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <p className="flex-1 truncate text-sm font-bold text-(--color-text-strong)">
          {mission.partnerA} · {mission.partnerB}
        </p>
        {cleared ? (
          <Tag variant="success">완주</Tag>
        ) : (
          <Tag variant="primary">STEP {mission.currentStep}</Tag>
        )}
      </div>

      <p className="mt-1 truncate text-xs text-(--color-text-sub)">
        {cleared
          ? `${mission.matchedAt} 매칭 · 전체 미션 완료`
          : MISSION_STEP_TITLES[mission.currentStep]}
      </p>

      <div className="mt-1 flex items-center gap-2">
        <p className="flex-1 text-xs text-(--color-text-muted)">
          {mission.lastCompletedAt
            ? `마지막 인증 ${mission.lastCompletedAt}`
            : `${mission.matchedAt} 매칭 · 인증 없음`}
        </p>
        {cleared ? null : (
          <Button size="sm" onClick={onComplete}>
            STEP {mission.currentStep} 완료
          </Button>
        )}
      </div>
    </li>
  );
}
