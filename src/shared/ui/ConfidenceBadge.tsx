import type { ConfidenceLevel } from "../../entities/source/types";

type ConfidenceBadgeProps = {
  confidence: ConfidenceLevel;
};

const confidenceLabel: Record<ConfidenceLevel, string> = {
  high: "Высокая",
  medium: "Средняя",
  low: "Низкая",
};

const confidenceClassName: Record<ConfidenceLevel, string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-red-200 bg-red-50 text-red-700",
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${confidenceClassName[confidence]}`}
    >
      {confidenceLabel[confidence]}
    </span>
  );
}
