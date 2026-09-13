import { RequireProfile } from "@ui/공통/RequireProfile";

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return <RequireProfile>{children}</RequireProfile>;
}
