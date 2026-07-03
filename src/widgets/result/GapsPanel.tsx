import type { KnowledgeGap } from "../../entities/gap/types";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { SectionCard } from "../../shared/ui/SectionCard";

type GapsPanelProps = {
  gaps: KnowledgeGap[];
};

const severityClassName: Record<KnowledgeGap["severity"], string> = {
  low: "border-slate-200 bg-slate-50 text-slate-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-red-200 bg-red-50 text-red-700",
};

export function GapsPanel({ gaps }: GapsPanelProps) {
  return (
    <SectionCard title="Пробелы в данных" eyebrow="Knowledge gaps">
      {gaps.length > 0 ? (
        <div className="space-y-3">
          {gaps.map((gap) => (
            <article key={gap.id} className="rounded border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">{gap.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{gap.description}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className={`rounded border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${severityClassName[gap.severity]}`}>
                    {gap.severity}
                  </span>
                  <ConfidenceBadge confidence={gap.confidence} />
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                <span className="font-semibold">Missing evidence: </span>
                {gap.missingEvidence}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                <span className="font-semibold">Recommendation: </span>
                {gap.recommendedAction}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          В выбранном результате критичных пробелов не найдено.
        </div>
      )}
    </SectionCard>
  );
}
