import { notFound } from "next/navigation";
import { AdminChatScreen } from "@ui/관리자/AdminChatScreen";
import { adminReports } from "@ui/관리자/admin.mock";

export default async function AdminChatPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const report = adminReports.find((item) => item.reportId === reportId);

  // 신고와 엮이지 않은 채팅방은 열 수 없다.
  if (!report || !report.chatroomId) {
    notFound();
  }

  return <AdminChatScreen report={report} />;
}
