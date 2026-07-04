import type { KnowledgeGap } from "../../shared/types/search";
import { SectionCard } from "../../shared/ui/SectionCard";

type GapsPanelProps = {
  gaps: KnowledgeGap[];
};

const severityClassName: Record<KnowledgeGap["severity"], string> = {
  low: "border-slate-200 bg-slate-50 text-slate-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
};

const severityLabel: Record<KnowledgeGap["severity"], string> = {
  low: "низкая",
  medium: "средняя",
  high: "высокая",
};

export function GapsPanel({ gaps }: GapsPanelProps) {
  return (
    <SectionCard title="Пробелы" eyebrow="Недостающие доказательства">
      {gaps.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-emerald-800">Критичные пробелы не найдены</p>
          <p className="mt-2 text-sm text-emerald-700">
            Для выбранного результата нет явно выделенных недостающих данных.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gaps.map((gap) => (
            <article
              key={gap.id}
              className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-6 text-slate-950">
                    {gap.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {gap.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${severityClassName[gap.severity]}`}
                >
                  {severityLabel[gap.severity]}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
