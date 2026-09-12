import { Button } from "@ui/공통/Button";

export function AdminLoadState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      role={error ? "alert" : undefined}
      className={`flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center text-sm ${
        error ? "text-(--color-danger)" : "text-(--color-text-sub)"
      }`}
    >
      <span>{error ?? (loading ? "불러오는 중..." : "데이터가 없습니다.")}</span>
      {error ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          다시 시도
        </Button>
      ) : null}
    </div>
  );
}
