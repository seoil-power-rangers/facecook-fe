import { MissionScreen } from "@ui/미션/MissionScreen";

export default async function MatchMissionPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <MissionScreen matchId={roomId} />;
}
