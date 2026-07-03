import type { Condition } from "../../entities/claim/types";
import type { ParsedQuery } from "../../entities/query/types";
import { SectionCard } from "../../shared/ui/SectionCard";

type ParsedQueryCardProps = {
  parsedQuery: ParsedQuery;
};

function formatCondition(condition: Condition): string {
  if (condition.operator === "range") {
    return `${condition.parameter}: ${condition.minValue}-${condition.maxValue} ${condition.unit}`;
  }

  if (condition.value !== undefined) {
    const operatorLabel: Record<Condition["operator"], string> = {
      equals: "=",
      less_than: "<",
      less_than_or_equal: "<=",
      greater_than: ">",
      greater_than_or_equal: ">=",
      range: "",
      approximately: "~",
    };

    return `${condition.parameter}: ${operatorLabel[condition.operator]} ${condition.value} ${condition.unit}`;
  }

  return `${condition.parameter}: ${condition.unit}`;
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-sm text-slate-400">Не выделено</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded border border-ice-100 bg-ice-50 px-2.5 py-1 text-xs font-medium text-ice-600">
          {item}
        </span>
      ))}
    </div>
  );
}

export function ParsedQueryCard({ parsedQuery }: ParsedQueryCardProps) {
  const timeRange = parsedQuery.timeScope
    ? `${parsedQuery.timeScope.fromYear}-${parsedQuery.timeScope.toYear}`
    : "Не задан";

  return (
    <SectionCard title="Как система поняла запрос" eyebrow="Parsed query">
      <div className="space-y-4">
        <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Normalized question
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{parsedQuery.normalizedQuestion}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Intent</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{parsedQuery.intent}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Time range</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{timeRange}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Materials</p>
          <div className="mt-2">
            <TagList items={parsedQuery.materials} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Processes</p>
          <div className="mt-2">
            <TagList items={parsedQuery.processes} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Technologies / equipment</p>
          <div className="mt-2">
            <TagList items={parsedQuery.equipment} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Numeric conditions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {parsedQuery.numericConditions.map((condition) => (
              <span key={condition.id} className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
                {formatCondition(condition)}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Geography</p>
          <p className="mt-2 text-sm text-slate-500">Не указана в mock-контракте</p>
        </div>
      </div>
    </SectionCard>
  );
}
