import type { ReactNode } from "react";
import type { Condition, ParsedQuery } from "../../shared/types/search";
import { SectionCard } from "../../shared/ui/SectionCard";

type ParsedQueryCardProps = {
  parsedQuery: ParsedQuery;
};

const operatorLabel: Record<Condition["operator"], string> = {
  equals: "=",
  less_than: "<",
  less_than_or_equal: "<=",
  greater_than: ">",
  greater_than_or_equal: ">=",
  range: "диапазон",
  approximately: "~",
};

function getTimeRange(parsedQuery: ParsedQuery): string {
  const range = parsedQuery.timeRange ?? parsedQuery.timeScope;

  if (!range) {
    return "Не задан";
  }

  return `${range.fromYear}-${range.toYear}`;
}

function getConditionValue(condition: Condition): string {
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

  return condition.rawValue ?? "значение не указано";
}

function formatCondition(condition: Condition): string {
  const conditionName = condition.name ?? condition.parameter;
  const value = getConditionValue(condition);
  const unit = condition.unit ? ` ${condition.unit}` : "";
  const rawValue = condition.rawValue ? ` (${condition.rawValue})` : "";

  return `${conditionName}: ${value}${unit}${rawValue}`;
}

function ChipList({ items, emptyLabel = "Не выделено" }: { items: string[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return (
      <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-400">
        {emptyLabel}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-ice-100 bg-ice-50 px-3 py-1 text-xs font-medium text-ice-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function FieldBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function ParsedQueryCard({ parsedQuery }: ParsedQueryCardProps) {
  const conditions = parsedQuery.conditions ?? parsedQuery.numericConditions;
  const technologies = parsedQuery.technologies ?? [];
  const geography = parsedQuery.geography ?? [];

  return (
    <SectionCard title="Как разобран запрос" eyebrow="Структура запроса">
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Нормализованный вопрос
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {parsedQuery.normalizedQuestion || parsedQuery.originalText || "Запрос не указан."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FieldBlock title="Намерение">
            <p className="text-sm font-semibold text-slate-900">{parsedQuery.intent}</p>
          </FieldBlock>
          <FieldBlock title="Период">
            <p className="text-sm font-semibold text-slate-900">{getTimeRange(parsedQuery)}</p>
          </FieldBlock>
          <FieldBlock title="Область">
            <p className="text-sm font-semibold text-slate-900">{parsedQuery.domain}</p>
          </FieldBlock>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <FieldBlock title="Материалы">
            <ChipList items={parsedQuery.materials} />
          </FieldBlock>
          <FieldBlock title="Процессы">
            <ChipList items={parsedQuery.processes} />
          </FieldBlock>
          <FieldBlock title="Технологии">
            <ChipList items={technologies} />
          </FieldBlock>
          <FieldBlock title="Свойства">
            <ChipList items={parsedQuery.targetParameters} />
          </FieldBlock>
          <FieldBlock title="География">
            <ChipList items={geography} emptyLabel="Не указана" />
          </FieldBlock>
          <FieldBlock title="Оборудование">
            <ChipList items={parsedQuery.equipment} />
          </FieldBlock>
        </div>

        <FieldBlock title="Условия">
          <div className="flex flex-wrap gap-2">
            {conditions.length > 0 ? (
              conditions.map((condition) => (
                <span
                  key={condition.id}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-700"
                >
                  {formatCondition(condition)}
                </span>
              ))
            ) : (
              <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-400">
                Не выделены
              </span>
            )}
          </div>
        </FieldBlock>
      </div>
    </SectionCard>
  );
}
