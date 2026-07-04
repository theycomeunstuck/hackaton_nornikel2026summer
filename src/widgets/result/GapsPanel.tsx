import type { KnowledgeGap } from "../../shared/types/search";
import { SectionCard } from "../../shared/ui/SectionCard";

type GapsPanelProps = {
  gaps: KnowledgeGap[];
};

type GapUiSeverity = "info" | "warning";

const severityClassName: Record<GapUiSeverity, string> = {
  info: "border-ice-200 bg-ice-50 text-ice-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

const severityLabel: Record<GapUiSeverity, string> = {
  info: "info",
  warning: "warning",
};

function getUiSeverity(gap: KnowledgeGap): GapUiSeverity {
  return gap.severity === "high" || gap.severity === "medium" ? "warning" : "info";
}

export function GapsPanel({ gaps }: GapsPanelProps) {
  return (
    <SectionCard title="Пробелы" eyebrow="Недостающие доказательства">
      {gaps.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-emerald-800">
            Критичных пробелов не найдено
          </p>
          <p className="mt-2 text-sm text-emerald-700">
            В текущем результате нет явно выделенных слабых мест доказательной базы.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gaps.map((gap) => {
            const uiSeverity = getUiSeverity(gap);

            return (
              <article
                key={gap.id}
                className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-6 text-slate-950">
                      {gap.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {gap.description}
                    </p>
                    {gap.recommendation ?? gap.recommendedAction ? (
                      <p className="mt-3 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm leading-6 text-slate-700">
                        <span className="font-semibold">Следующий шаг: </span>
                        {gap.recommendation ?? gap.recommendedAction}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${severityClassName[uiSeverity]}`}
                  >
                    {severityLabel[uiSeverity]}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
