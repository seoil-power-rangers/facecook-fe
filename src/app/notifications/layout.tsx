import { RequireProfile } from "@ui/공통/RequireProfile";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireProfile>{children}</RequireProfile>;
}
