import { AdminChatScreen } from "@ui/관리자/AdminChatScreen";

export default async function AdminChatPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  return <AdminChatScreen reportId={reportId} />;
}
