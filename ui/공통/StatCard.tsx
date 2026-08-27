interface StatCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export function StatCard({ label, value, highlight }: StatCardProps) {
  const valueClassName = highlight
    ? "text-lg font-bold text-(--color-primary)"
    : "text-lg font-bold text-(--color-text-strong)";

  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-(--radius-lg) bg-(--color-surface) p-3 shadow-(--shadow-card)">
      <span className="text-xs text-(--color-text-sub)">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}
