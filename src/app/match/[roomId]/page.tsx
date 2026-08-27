import { notFound } from "next/navigation";
import { ChatScreen } from "@ui/채팅/ChatScreen";
import { matchRooms } from "@ui/매칭/matches.mock";

export default async function MatchRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = matchRooms.find((item) => item.id === roomId);

  if (!room) {
    notFound();
  }

  return (
    <ChatScreen
      userId={room.id}
      name={room.name}
      mbti={room.mbti}
      department={room.department}
      bgColor={room.bgColor}
      presence={room.presence}
      messages={room.messages}
    />
  );
}
