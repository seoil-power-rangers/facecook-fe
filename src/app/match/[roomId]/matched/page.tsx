import { notFound } from "next/navigation";
import { MatchedCelebrationScreen } from "@ui/매칭/MatchedCelebrationScreen";
import { matchRooms } from "@ui/매칭/matches.mock";

export default async function MatchedPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = matchRooms.find((item) => item.id === roomId);

  if (!room) {
    notFound();
  }

  return <MatchedCelebrationScreen room={room} />;
}
