import { Check } from "lucide-react";

interface SelectCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function SelectCard({ label, selected, onSelect }: SelectCardProps) {
  let containerClassName =
    "flex w-full items-center gap-3 rounded-(--radius-lg) border bg-(--color-surface) px-4 py-3 text-left transition-colors";
  containerClassName += selected ? " border-(--color-primary)" : " border-(--color-border)";

  let indicatorClassName = "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border";
  if (selected) {
    indicatorClassName += " border-(--color-primary) bg-(--color-primary)";
  } else {
    indicatorClassName += " border-(--color-border-strong)";
  }

  return (
    <button type="button" onClick={onSelect} className={containerClassName}>
      <span className={indicatorClassName} aria-hidden="true">
        {selected ? <Check className="h-3 w-3 text-(--color-text-on-primary)" /> : null}
      </span>
      <span className="text-sm text-(--color-text-strong)">{label}</span>
    </button>
  );
}
