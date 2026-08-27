import { ProfileDetailScreen } from "@ui/프로필상세/ProfileDetailScreen";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return <ProfileDetailScreen userId={userId} />;
}
