import { useState } from "react";
import type { AnswerSummary } from "../../shared/types/search";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { SectionCard } from "../../shared/ui/SectionCard";

type AnswerSummaryCardProps = {
  answer: AnswerSummary;
};

type AnswerSummaryWithNumericMode = AnswerSummary & {
  numericMode?: string | boolean;
};

const longConclusionThreshold = 560;

function getNumericMode(answer: AnswerSummary): string | boolean | undefined {
  return (answer as AnswerSummaryWithNumericMode).numericMode;
}

function getNumericModeLabel(answer: AnswerSummary): string {
  const numericMode = getNumericMode(answer);

  if (typeof numericMode === "boolean") {
    return numericMode ? "Структурирован" : "Не используется";
  }

  if (numericMode === "structured") {
    return "Структурирован";
  }

  if (numericMode === "mixed") {
    return "Смешанный";
  }

  if (numericMode === "none") {
    return "Без числового режима";
  }

  if (typeof numericMode === "string" && numericMode.trim().length > 0) {
    return numericMode;
  }

  return "Не указан";
}

function getNumericModeClassName(answer: AnswerSummary): string {
  const numericMode = getNumericMode(answer);

  if (numericMode === true || numericMode === "structured") {
    return "border-ice-200 bg-ice-50 text-ice-700";
  }

  if (numericMode === "mixed") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const warnings = answer.warnings ?? answer.limitations;
  const isLongConclusion = answer.shortConclusion.length > longConclusionThreshold;

  return (
    <SectionCard title="Краткий вывод" eyebrow="Резюме анализа">
      <div className="space-y-4">
        <div className="rounded-xl border border-ice-100 bg-gradient-to-br from-ice-50/85 to-white p-4">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ice-600">
                Вывод по найденным доказательствам
              </p>
              <p
                className={`mt-3 max-w-5xl text-base leading-8 text-slate-900 ${
                  isLongConclusion && !isExpanded ? "line-clamp-5" : ""
                }`}
              >
                {answer.shortConclusion}
              </p>
              {isLongConclusion ? (
                <button
                  type="button"
                  onClick={() => setIsExpanded((currentValue) => !currentValue)}
                  className="mt-3 rounded-full border border-ice-100 bg-white px-3 py-1.5 text-xs font-semibold text-ice-700 transition hover:border-ice-300 hover:bg-ice-50 focus:outline-none focus:ring-4 focus:ring-ice-100"
                >
                  {isExpanded ? "Скрыть полный текст" : "Показать полностью"}
                </button>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <ConfidenceBadge confidence={answer.confidence} />
              <span
                className={`inline-flex rounded border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${getNumericModeClassName(
                  answer,
                )}`}
              >
                {getNumericModeLabel(answer)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_240px] gap-4">
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
            <span
              className={`mt-2 inline-flex rounded border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${getNumericModeClassName(
                answer,
              )}`}
            >
              {getNumericModeLabel(answer)}
            </span>
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
