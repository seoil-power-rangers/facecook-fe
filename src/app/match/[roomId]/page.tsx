import { ChatScreen } from "@ui/채팅/ChatScreen";

export default async function MatchRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <ChatScreen matchId={roomId} />;
}
