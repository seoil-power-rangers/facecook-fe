import { SuperChatScreen } from "@ui/슈퍼/SuperChatScreen";

export default async function SuperChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return <SuperChatScreen matchId={matchId} />;
}
