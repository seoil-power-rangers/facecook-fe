import { RequireProfile } from "@ui/공통/RequireProfile";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <RequireProfile>{children}</RequireProfile>;
}
