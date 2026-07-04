import type { Condition, EvidenceItem } from "../../shared/types/search";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { SectionCard } from "../../shared/ui/SectionCard";

type EvidenceTableProps = {
  evidence: EvidenceItem[];
};

type EvidenceItemWithScore = EvidenceItem & {
  score?: number;
};

const operatorLabel: Record<Condition["operator"], string> = {
  equals: "=",
  less_than: "<",
  less_than_or_equal: "<=",
  greater_than: ">",
  greater_than_or_equal: ">=",
  range: "",
  approximately: "~",
};

function formatConditionValue(condition: Condition): string {
  if (condition.operator === "range") {
    const min = condition.min ?? condition.minValue;
    const max = condition.max ?? condition.maxValue;

    if (min !== undefined && max !== undefined) {
      return `${min}-${max}`;
    }
  }

  if (condition.value !== undefined) {
    return `${operatorLabel[condition.operator]} ${condition.value}`;
  }

  return condition.rawValue ?? condition.note ?? "не указано";
}

function formatCondition(condition: Condition): string {
  const name = condition.name ?? condition.parameter;
  const unit = condition.unit ? ` ${condition.unit}` : "";

  return `${name}: ${formatConditionValue(condition)}${unit}`;
}

function formatSourceName(item: EvidenceItem): string {
  return item.sourceRef.sourceName ?? item.sourceRef.documentTitle;
}

function formatScore(item: EvidenceItem): string {
  const score = (item as EvidenceItemWithScore).score;

  if (typeof score !== "number") {
    return "—";
  }

  return score.toFixed(4);
}

function ConditionsCell({ conditions }: { conditions: Condition[] }) {
  if (conditions.length === 0) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="flex max-w-[280px] flex-wrap gap-1.5">
      {conditions.map((condition) => (
        <span
          key={condition.id}
          className="max-w-full rounded-full border border-ice-100 bg-ice-50 px-2.5 py-1 text-xs leading-5 text-ice-800"
          title={formatCondition(condition)}
        >
          <span className="line-clamp-1">{formatCondition(condition)}</span>
        </span>
      ))}
    </div>
  );
}

export function EvidenceTable({ evidence }: EvidenceTableProps) {
  return (
    <SectionCard
      title="Таблица доказательств"
      eyebrow="Фрагменты и источники"
      className="border-ice-100 bg-white/82"
    >
      {evidence.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
          <p className="text-sm font-semibold text-slate-700">Фрагменты доказательств не найдены</p>
          <p className="mt-2 text-sm text-slate-500">
            Выберите другой сценарий анализа или уточните запрос.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full table-fixed border-collapse text-left text-sm">
              <thead className="bg-graphite-900 text-xs uppercase tracking-[0.12em] text-slate-200">
                <tr>
                  <th className="w-[31%] px-4 py-3">Фрагмент доказательства</th>
                  <th className="w-[20%] px-4 py-3">Условия</th>
                  <th className="w-[17%] px-4 py-3">Источник</th>
                  <th className="w-[6%] px-4 py-3">Стр.</th>
                  <th className="w-[11%] px-4 py-3">Достоверность</th>
                  <th className="w-[6%] px-4 py-3">Год</th>
                  <th className="w-[9%] px-4 py-3">География</th>
                  <th className="w-[7%] px-4 py-3">Оценка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {evidence.map((item) => (
                  <tr key={item.id} className="align-top transition hover:bg-ice-50/45">
                    <td className="px-4 py-4">
                      <p className="line-clamp-4 max-w-[520px] text-sm leading-6 text-slate-900" title={item.statement}>
                        {item.statement}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <ConditionsCell conditions={item.conditions} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="line-clamp-2 font-medium leading-5 text-slate-800" title={formatSourceName(item)}>
                        {formatSourceName(item)}
                      </span>
                      {item.sourceRef.chunkId ? (
                        <span className="mt-1 block text-xs text-slate-500">{item.sourceRef.chunkId}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.sourceRef.page}</td>
                    <td className="px-4 py-4">
                      <ConfidenceBadge confidence={item.confidence} />
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.year}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {item.geography ?? item.sourceRef.geography ?? "—"}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-600">{formatScore(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
