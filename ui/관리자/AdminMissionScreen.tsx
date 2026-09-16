"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { Button } from "@ui/공통/Button";
import { Tag } from "@ui/공통/Tag";
import { TextField } from "@ui/공통/TextField";
import {
  adminErrorMessage,
  completeAdminMission,
  getAdminMissions,
  getAdminUserNames,
  type AdminMissionResponse,
} from "./adminApi";
import { AdminLoadState } from "./AdminLoadState";
import { AdminShell } from "./AdminShell";

const MISSION_LAST_STEP = 3;

/** 09 admin-mission — 부스에서 커플이 찾아오면 단계를 올려주는 화면. */
export function AdminMissionScreen() {
  const [keyword, setKeyword] = useState("");
  const [missions, setMissions] = useState<AdminMissionResponse[]>([]);
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [target, setTarget] = useState<AdminMissionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingMatchId, setUpdatingMatchId] = useState<number | null>(null);

  const loadMissions = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await getAdminMissions();
      setMissions(response);
      setUserNames(
        await getAdminUserNames(
          response.flatMap((mission) => [mission.userAId, mission.userBId]),
        ),
      );
    } catch (error) {
      setLoadError(adminErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMissions();
  }, [loadMissions]);

  const filtered = useMemo(() => {
    const trimmed = keyword.trim();
    if (!trimmed) return missions;
    return missions.filter((mission) => {
      const partnerA = displayName(userNames, mission.userAId);
      const partnerB = displayName(userNames, mission.userBId);
      return partnerA.includes(trimmed) || partnerB.includes(trimmed);
    });
  }, [keyword, missions, userNames]);

  const confirmComplete = async () => {
    if (!target || updatingMatchId !== null) return;

    setUpdatingMatchId(target.matchId);
    setActionError(null);
    try {
      const updated = await completeAdminMission(target.matchId);
      setMissions((current) =>
        current.map((mission) =>
          mission.matchId === updated.matchId ? updated : mission,
        ),
      );
      setTarget(null);
    } catch (error) {
      setActionError(adminErrorMessage(error));
    } finally {
      setUpdatingMatchId(null);
    }
  };

  return (
    <AdminShell title="미션 완료 처리">
      <div className="flex flex-col gap-3 p-4">
        <TextField
          placeholder="닉네임으로 찾기"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          trailing={<Search className="h-5 w-5 shrink-0 text-(--color-text-muted)" />}
        />

        {isLoading || loadError ? (
          <AdminLoadState
            loading={isLoading}
            error={loadError}
            onRetry={() => void loadMissions()}
          />
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-(--color-text-sub)">
            {keyword.trim() ? "찾는 참가자가 없어요." : "진행 중인 매칭이 없어요."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((mission) => (
              <MissionRow
                key={mission.matchId}
                mission={mission}
                partnerA={displayName(userNames, mission.userAId)}
                partnerB={displayName(userNames, mission.userBId)}
                disabled={updatingMatchId !== null}
                onComplete={() => {
                  setActionError(null);
                  setTarget(mission);
                }}
              />
            ))}
          </ul>
        )}
      </div>

      <BottomSheet
        open={target !== null}
        onClose={() => {
          if (updatingMatchId === null) setTarget(null);
        }}
      >
        {target ? (
          <div className="px-5 pt-3">
            <h2 className="text-[17px] font-bold text-(--color-text-strong)">
              STEP {target.currentStep} 완료로 처리할까요?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-(--color-text-body)">
              {displayName(userNames, target.userAId)} · {displayName(userNames, target.userBId)}
              커플의 「{currentMissionTitle(target)}」를 완료 처리합니다.
            </p>
            <p className="mt-2 text-xs text-(--color-danger)">완료 처리는 되돌릴 수 없어요.</p>
            {actionError ? (
              <p role="alert" className="mt-3 text-sm text-(--color-danger)">
                {actionError}
              </p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                disabled={updatingMatchId !== null}
                onClick={() => setTarget(null)}
              >
                취소
              </Button>
              <Button
                fullWidth
                disabled={updatingMatchId !== null}
                onClick={() => void confirmComplete()}
              >
                {updatingMatchId !== null ? "처리 중..." : "완료 처리"}
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
  partnerA,
  partnerB,
  disabled,
  onComplete,
}: {
  mission: AdminMissionResponse;
  partnerA: string;
  partnerB: string;
  disabled: boolean;
  onComplete: () => void;
}) {
  const cleared = mission.currentStep > MISSION_LAST_STEP;
  const lastCompletedAt = [
    mission.step3CompletedAt,
    mission.step2CompletedAt,
    mission.step1CompletedAt,
  ].find((value) => value !== null);

  return (
    <li
      className={`rounded-(--radius-lg) bg-(--color-surface) p-3.5 shadow-(--shadow-card) ${
        cleared ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <p className="flex-1 truncate text-sm font-bold text-(--color-text-strong)">
          {partnerA} · {partnerB}
        </p>
        {cleared ? <Tag variant="success">완주</Tag> : <Tag variant="primary">STEP {mission.currentStep}</Tag>}
      </div>

      <p className="mt-1 truncate text-xs text-(--color-text-sub)">
        {cleared
          ? `${formatDateTime(mission.matchedAt)} 매칭 · 전체 미션 완료`
          : currentMissionTitle(mission)}
      </p>

      <div className="mt-1 flex items-center gap-2">
        <p className="flex-1 text-xs text-(--color-text-muted)">
          {lastCompletedAt
            ? `마지막 인증 ${formatDateTime(lastCompletedAt)}`
            : `${formatDateTime(mission.matchedAt)} 매칭 · 인증 없음`}
        </p>
        {cleared ? null : (
          <Button size="sm" disabled={disabled} onClick={onComplete}>
            STEP {mission.currentStep} 완료
          </Button>
        )}
      </div>
    </li>
  );
}

function displayName(names: Record<number, string>, userId: number) {
  return names[userId] ?? `참가자 #${userId}`;
}

function currentMissionTitle(mission: AdminMissionResponse) {
  const missions = [
    mission.step1Mission,
    mission.step2Mission,
    mission.step3Mission,
  ];
  return missions[mission.currentStep - 1] ?? `STEP ${mission.currentStep} 랜덤 미션`;
}

function formatDateTime(value: string) {
  return value.replace("T", " ").slice(5, 16);
}
