import { RequireProfile } from "@ui/공통/RequireProfile";

export default function KokLayout({ children }: { children: React.ReactNode }) {
  return <RequireProfile>{children}</RequireProfile>;
}
