import { MatchedCelebrationScreen } from "@ui/매칭/MatchedCelebrationScreen";

export default async function MatchedPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <MatchedCelebrationScreen matchId={roomId} />;
}
