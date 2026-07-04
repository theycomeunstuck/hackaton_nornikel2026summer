import type { AnswerSummary } from "../../shared/types/search";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { SectionCard } from "../../shared/ui/SectionCard";

type AnswerSummaryCardProps = {
  answer: AnswerSummary;
};

type AnswerSummaryWithNumericMode = AnswerSummary & {
  numericMode?: string | boolean;
};

function getNumericModeLabel(answer: AnswerSummary): string {
  const numericMode = (answer as AnswerSummaryWithNumericMode).numericMode;

  if (typeof numericMode === "boolean") {
    return numericMode ? "Используется" : "Не используется";
  }

  if (typeof numericMode === "string" && numericMode.trim().length > 0) {
    return numericMode;
  }

  return "Не указан";
}

function WarningList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return (
      <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        Предупреждения не указаны.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {warnings.map((warning) => (
        <li
          key={warning}
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800"
        >
          {warning}
        </li>
      ))}
    </ul>
  );
}

export function AnswerSummaryCard({ answer }: AnswerSummaryCardProps) {
  const warnings = answer.warnings ?? answer.limitations;

  return (
    <SectionCard title="Краткий вывод" eyebrow="Резюме анализа">
      <div className="space-y-4">
        <div className="rounded-xl border border-ice-100 bg-ice-50/70 p-4">
          <div className="flex items-start justify-between gap-5">
            <p className="max-w-5xl text-base leading-8 text-slate-900">
              {answer.shortConclusion}
            </p>
            <ConfidenceBadge confidence={answer.confidence} />
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_220px] gap-4">
          <div className="rounded-xl border border-slate-200 bg-white/82 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Причина достоверности
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{answer.confidenceReason}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/82 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Числовой режим
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {getNumericModeLabel(answer)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Предупреждения
          </p>
          <div className="mt-2">
            <WarningList warnings={warnings} />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
