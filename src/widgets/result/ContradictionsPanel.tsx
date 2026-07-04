import type { Contradiction, SourceRef } from "../../shared/types/search";
import { SectionCard } from "../../shared/ui/SectionCard";

type ContradictionsPanelProps = {
  contradictions: Contradiction[];
};

type ContradictionStatus = NonNullable<Contradiction["status"]>;

const statusLabel: Record<ContradictionStatus, string> = {
  possible: "Возможное противоречие",
  needs_review: "Требует экспертной проверки",
  confirmed: "Подтверждено",
  resolved: "Разрешено",
};

const statusClassName: Record<ContradictionStatus, string> = {
  possible: "border-amber-200 bg-amber-50 text-amber-700",
  needs_review: "border-ice-200 bg-ice-50 text-ice-700",
  confirmed: "border-orange-200 bg-orange-50 text-orange-700",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function getStatus(contradiction: Contradiction): ContradictionStatus {
  return contradiction.status ?? "needs_review";
}

function getSourceName(source: SourceRef): string {
  return source.sourceName ?? source.documentTitle;
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
      <p
        className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-900"
        title={getSourceName(source)}
      >
        {getSourceName(source)}
      </p>
      <div className="mt-3 grid gap-2 text-xs text-slate-600">
        <span>стр. {source.page}</span>
        <span className="break-all">{source.chunkId}</span>
      </div>
    </div>
  );
}

export function ContradictionsPanel({ contradictions }: ContradictionsPanelProps) {
  return (
    <SectionCard title="Противоречия" eyebrow="Точки экспертной проверки">
      {contradictions.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-emerald-800">
            Явных противоречий не найдено
          </p>
          <p className="mt-2 text-sm text-emerald-700">
            В текущем результате нет конфликтующих выводов между источниками.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contradictions.map((contradiction) => {
            const sourceA = contradiction.sourceRefs[0];
            const sourceB = contradiction.sourceRefs[1];
            const status = getStatus(contradiction);

            return (
              <article
                key={contradiction.id}
                className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-6 text-slate-950">
                      {contradiction.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {contradiction.description}
                    </p>
                    {contradiction.possibleReason ? (
                      <p className="mt-3 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm leading-6 text-slate-700">
                        <span className="font-semibold">Возможная причина: </span>
                        {contradiction.possibleReason}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusClassName[status]}`}
                  >
                    {statusLabel[status]}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <SourceReferenceCard source={sourceA} label="Источник A" />
                  <SourceReferenceCard source={sourceB} label="Источник B" />
                </div>

                {contradiction.recommendation ? (
                  <p className="mt-3 rounded-lg border border-ice-100 bg-ice-50/80 px-3 py-2 text-sm leading-6 text-ice-800">
                    <span className="font-semibold">Следующий шаг: </span>
                    {contradiction.recommendation}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
