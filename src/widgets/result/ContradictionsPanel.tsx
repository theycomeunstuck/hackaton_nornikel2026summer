import type { Contradiction } from "../../entities/contradiction/types";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { SectionCard } from "../../shared/ui/SectionCard";

type ContradictionsPanelProps = {
  contradictions: Contradiction[];
};

const severityClassName: Record<Contradiction["severity"], string> = {
  minor: "border-amber-200 bg-amber-50 text-amber-700",
  moderate: "border-orange-200 bg-orange-50 text-orange-700",
  critical: "border-red-200 bg-red-50 text-red-700",
};

const severityLabel: Record<Contradiction["severity"], string> = {
  minor: "низкая",
  moderate: "средняя",
  critical: "критичная",
};

export function ContradictionsPanel({ contradictions }: ContradictionsPanelProps) {
  return (
    <SectionCard title="Возможные противоречия" eyebrow="Конфликты доказательств">
      {contradictions.length > 0 ? (
        <div className="space-y-3">
          {contradictions.map((contradiction) => (
            <article key={contradiction.id} className="rounded border border-orange-200 bg-orange-50/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">{contradiction.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{contradiction.description}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className={`rounded border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${severityClassName[contradiction.severity]}`}>
                    {severityLabel[contradiction.severity]}
                  </span>
                  <ConfidenceBadge confidence={contradiction.confidence} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                {contradiction.sourceRefs.slice(0, 2).map((sourceRef, index) => (
                  <div key={sourceRef.chunkId} className="rounded border border-white/80 bg-white/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Источник {index === 0 ? "A" : "B"}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-5 text-slate-800">
                      {sourceRef.documentTitle}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">стр. {sourceRef.page} / {sourceRef.chunkId}</p>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                <span className="font-semibold">Рекомендация: </span>
                {contradiction.resolutionHint}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          В выбранном результате явных противоречий не найдено.
        </div>
      )}
    </SectionCard>
  );
}
