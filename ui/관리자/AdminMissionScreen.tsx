"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { Tag } from "@ui/공통/Tag";
import { TextField } from "@ui/공통/TextField";
import {
  adminErrorMessage,
  completeAdminMission,
  getAdminMissions,
  getAdminUserNames,
  isMissionStepConflict,
  type AdminMissionExcludedResponse,
  type AdminMissionResponse,
} from "./adminApi";
import { AdminLoadState } from "./AdminLoadState";
import { AdminShell } from "./AdminShell";

const MISSION_LAST_STEP = 3;

/** 09 admin-mission — 부스에서 커플이 찾아오면 단계를 올려주는 화면. */
export function AdminMissionScreen() {
  const [keyword, setKeyword] = useState("");
  const [missions, setMissions] = useState<AdminMissionResponse[]>([]);
  const [excluded, setExcluded] = useState<AdminMissionExcludedResponse[]>([]);
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [target, setTarget] = useState<AdminMissionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingMatchId, setUpdatingMatchId] = useState<number | null>(null);
  const [conflictNotice, setConflictNotice] = useState<string | null>(null);

  /** 목록을 다시 불러온다. 호출부가 성공 여부로 분기할 수 있도록 boolean을 돌려준다. */
  const loadMissions = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await getAdminMissions();
      setMissions(response.items);
      setExcluded(response.excluded);
      setUserNames(
        await getAdminUserNames(
          response.items.flatMap((mission) => [mission.userAId, mission.userBId]),
        ),
      );
      return true;
    } catch (error) {
      setLoadError(adminErrorMessage(error));
      return false;
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
      const updated = await completeAdminMission(target.matchId, target.currentStep);
      setMissions((current) =>
        current.map((mission) =>
          mission.matchId === updated.matchId ? updated : mission,
        ),
      );
      setTarget(null);
      setConflictNotice(null);
    } catch (error) {
      if (isMissionStepConflict(error)) {
        // 확인받은 STEP이 이미 처리됐다 — 다른 관리자가 먼저 처리했거나 재시도로
        // 중복 요청된 경우. 사이트를 닫고 화면을 최신 상태로 다시 불러온다.
        // 재조회가 성공했을 때만 안내를 띄운다 — 실패하면 loadError가 대신 뜬다.
        setTarget(null);
        if (await loadMissions()) {
          setConflictNotice("이미 처리된 단계예요. 최신 상태로 다시 불러왔어요.");
        }
      } else {
        setActionError(adminErrorMessage(error));
      }
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

        {!isLoading && !loadError && excluded.length > 0 ? (
          <ExcludedMissionsNotice excluded={excluded} />
        ) : null}

        {conflictNotice ? <InfoBox tone="info">{conflictNotice}</InfoBox> : null}

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
                  setConflictNotice(null);
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

// BE #86 계약: NO_TEMPLATE(묶음 배정 실패), UNKNOWN(그 밖의 예상 외 오류). 코드 그대로
// 보여주면 관리자가 뜻을 알 수 없으니 한국어 문구로 바꾼다. 계약에 없는 새 코드가 와도
// 화면이 깨지지 않도록 기본 문구를 둔다.
const EXCLUDED_REASON_LABELS: Record<string, string> = {
  NO_TEMPLATE: "배정할 미션 묶음을 찾지 못함",
  UNKNOWN: "원인을 알 수 없는 오류",
};

function excludedReasonLabel(reason: string | null | undefined) {
  if (!reason) return "사유 미상";
  return EXCLUDED_REASON_LABELS[reason] ?? "원인을 알 수 없는 오류";
}

/** 서버가 목록에서 제외한 매칭(예: 묶음 배정 실패)을 조용히 빠뜨리지 않고 보여준다. */
function ExcludedMissionsNotice({ excluded }: { excluded: AdminMissionExcludedResponse[] }) {
  return (
    <InfoBox tone="danger">
      <p className="font-bold">미션이 배정되지 않아 목록에서 빠진 매칭 {excluded.length}건</p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {excluded.map((item) => (
          <li key={item.matchId}>
            매칭 #{item.matchId} · {excludedReasonLabel(item.reason)}
          </li>
        ))}
      </ul>
    </InfoBox>
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
