import { notFound } from "next/navigation";
import { MissionScreen } from "@ui/미션/MissionScreen";
import { matchRooms } from "@ui/매칭/matches.mock";

export default async function MatchMissionPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = matchRooms.find((item) => item.id === roomId);

  if (!room) {
    notFound();
  }

  return <MissionScreen partnerName={room.name} />;
}
