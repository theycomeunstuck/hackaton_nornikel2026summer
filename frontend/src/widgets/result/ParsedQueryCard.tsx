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

const intentLabel: Record<string, string> = {
  technology_selection: "Выбор технологии",
  parameter_optimization: "Оптимизация параметров",
  evidence_review: "Проверка доказательств",
  gap_analysis: "Анализ пробелов",
  literature_review: "Обзор публикаций",
  experiments_lookup: "Поиск экспериментов",
};

function getIntentLabel(intent: string): string {
  return intentLabel[intent] ?? intent;
}

function getTimeRange(parsedQuery: ParsedQuery): string {
  const range = parsedQuery.timeRange ?? parsedQuery.timeScope;

  if (!range) {
    return "Не задан";
  }

  return `${range.fromYear}–${range.toYear}`;
}

function getConditionValue(condition: Condition): string {
  if (condition.rawValue) {
    return condition.rawValue;
  }

  if (condition.operator === "range") {
    const min = condition.min ?? condition.minValue;
    const max = condition.max ?? condition.maxValue;

    if (min !== undefined && max !== undefined) {
      return `${min}–${max}${condition.unit ? ` ${condition.unit}` : ""}`;
    }
  }

  if (condition.value !== undefined) {
    return `${operatorLabel[condition.operator]} ${condition.value}${condition.unit ? ` ${condition.unit}` : ""}`;
  }

  return "значение не указано";
}

function ChipList({ items, emptyLabel = "Не выделено" }: { items: string[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-400">
        {emptyLabel}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex rounded-full border border-ice-100 bg-ice-50 px-3 py-1 text-xs font-medium text-ice-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function FieldBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ConditionChip({ condition }: { condition: Condition }) {
  const conditionName = condition.name ?? condition.parameter;
  const value = getConditionValue(condition);
  const operator = operatorLabel[condition.operator];
  const unit = condition.unit || "без единиц";

  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-xl border border-cyan-100 bg-cyan-50/80 px-3 py-2 text-xs leading-5 text-slate-700">
      <span className="font-semibold text-slate-950">{conditionName}</span>
      <span className="rounded-full bg-white/80 px-2 py-0.5 font-semibold text-cyan-700">
        {value}
      </span>
      <span className="text-slate-500">{operator}</span>
      <span className="text-slate-500">{unit}</span>
    </span>
  );
}

export function ParsedQueryCard({ parsedQuery }: ParsedQueryCardProps) {
  const conditions = parsedQuery.conditions ?? parsedQuery.numericConditions;
  const technologies = parsedQuery.technologies ?? [];
  const geography = parsedQuery.geography ?? [];
  const properties = parsedQuery.targetParameters ?? [];

  return (
    <SectionCard title="Понимание запроса" eyebrow="Структура результата">
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <FieldBlock title="Намерение">
            <p className="text-sm font-semibold text-slate-900">
              {getIntentLabel(parsedQuery.intent)}
            </p>
          </FieldBlock>
          <FieldBlock title="Период">
            <p className="text-sm font-semibold text-slate-900">{getTimeRange(parsedQuery)}</p>
          </FieldBlock>
          <FieldBlock title="География">
            <ChipList items={geography} emptyLabel="Любая" />
          </FieldBlock>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
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
            <ChipList items={properties} />
          </FieldBlock>
        </div>

        <FieldBlock title="Числовые условия">
          {conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition) => (
                <ConditionChip key={condition.id} condition={condition} />
              ))}
            </div>
          ) : (
            <ChipList items={[]} emptyLabel="Числовые условия не выделены" />
          )}
        </FieldBlock>
      </div>
    </SectionCard>
  );
}
