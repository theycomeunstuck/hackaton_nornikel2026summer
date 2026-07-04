import type { Contradiction, SourceRef } from "../../shared/types/search";
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

const statusLabel: Record<NonNullable<Contradiction["status"]>, string> = {
  possible: "возможное",
  confirmed: "подтверждённое",
  resolved: "разрешено",
};

function formatStatus(contradiction: Contradiction): string {
  return contradiction.status ? statusLabel[contradiction.status] : severityLabel[contradiction.severity];
}

function SourceReferenceCard({ source, label }: { source?: SourceRef; label: string }) {
  if (!source) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white/72 px-3 py-3 text-sm text-slate-500">
        {label}: источник не указан
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/80 bg-white/86 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
        {source.sourceName ?? source.documentTitle}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        стр. {source.page} · {source.chunkId}
      </p>
    </div>
  );
}

export function ContradictionsPanel({ contradictions }: ContradictionsPanelProps) {
  return (
    <SectionCard title="Противоречия" eyebrow="Точки экспертной проверки">
      {contradictions.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-emerald-800">Явные противоречия не найдены</p>
          <p className="mt-2 text-sm text-emerald-700">
            В выбранном результате нет конфликтующих выводов между источниками.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contradictions.map((contradiction) => {
            const sourceA = contradiction.sourceRefs[0];
            const sourceB = contradiction.sourceRefs[1];

            return (
              <article
                key={contradiction.id}
                className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-6 text-slate-950">
                      {contradiction.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {contradiction.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${severityClassName[contradiction.severity]}`}
                    >
                      {formatStatus(contradiction)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <SourceReferenceCard source={sourceA} label="Источник A" />
                  <SourceReferenceCard source={sourceB} label="Источник B" />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
