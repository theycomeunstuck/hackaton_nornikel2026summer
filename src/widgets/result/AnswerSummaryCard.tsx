import type { AnswerSummary } from "../../shared/types/search";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { SectionCard } from "../../shared/ui/SectionCard";

type AnswerSummaryCardProps = {
  answer: AnswerSummary;
};

export function AnswerSummaryCard({ answer }: AnswerSummaryCardProps) {
  return (
    <SectionCard title="Краткий вывод" eyebrow="Answer summary">
      <div className="rounded border border-ice-100 bg-ice-50/70 p-4">
        <div className="flex items-start justify-between gap-4">
          <p className="text-base leading-7 text-slate-900">{answer.shortConclusion}</p>
          <ConfidenceBadge confidence={answer.confidence} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{answer.confidenceReason}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Key findings</h3>
          <ul className="mt-3 space-y-2">
            {answer.keyFindings.map((finding) => (
              <li key={finding} className="border-l-2 border-emerald-400 pl-3 text-sm leading-6 text-slate-700">
                {finding}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-950">Warnings / limitations</h3>
          {answer.limitations.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {answer.limitations.map((limitation) => (
                <li key={limitation} className="border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-700">
                  {limitation}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Критичных ограничений не найдено.</p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
