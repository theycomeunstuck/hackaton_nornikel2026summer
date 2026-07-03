import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Contradiction } from "../../entities/contradiction/types";
import type { KnowledgeGap } from "../../entities/gap/types";
import type { SourceType } from "../../entities/source/types";
import {
  buildContradictionStats,
  filterContradictionItems,
  type ContradictionFilters,
  type ContradictionListItem,
} from "../../shared/lib/contradictionStats";
import { getSourceTypeLabel } from "../../shared/lib/sourceStats";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { MetricCard } from "../../shared/ui/MetricCard";
import { SectionCard } from "../../shared/ui/SectionCard";
import { StatusBadge, type StatusTone } from "../../shared/ui/StatusBadge";

const contradictionStats = buildContradictionStats();

const initialFilters: ContradictionFilters = {
  severity: "all",
  topic: "",
  sourceType: "all",
  search: "",
};

function getSeverityTone(severity: Contradiction["severity"] | KnowledgeGap["severity"]): StatusTone {
  if (severity === "critical" || severity === "high") {
    return "danger";
  }

  if (severity === "moderate" || severity === "medium") {
    return "warning";
  }

  return "neutral";
}

function formatList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "не указано";
}

function ContradictionCard({ item }: { item: ContradictionListItem }) {
  const sourceA = item.contradiction.sourceRefs[0];
  const sourceB = item.contradiction.sourceRefs[1];

  return (
    <article className="rounded border border-orange-200 bg-orange-50/60 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-5">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{item.contradiction.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{item.contradiction.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge label={item.contradiction.severity} tone={getSeverityTone(item.contradiction.severity)} />
            <ConfidenceBadge confidence={item.contradiction.confidence} />
            <StatusBadge label={item.topic} tone="info" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded border border-white/80 bg-white/86 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Утверждение A</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {item.claimA?.statement ?? item.contradiction.conflictingStatements[0] ?? "Утверждение не связано."}
          </p>
          {sourceA ? (
            <p className="mt-3 text-xs text-slate-500">
              {sourceA.documentTitle}, стр. {sourceA.page}
            </p>
          ) : null}
        </div>
        <div className="rounded border border-white/80 bg-white/86 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Утверждение B</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {item.claimB?.statement ?? item.contradiction.conflictingStatements[1] ?? "Утверждение не связано."}
          </p>
          {sourceB ? (
            <p className="mt-3 text-xs text-slate-500">
              {sourceB.documentTitle}, стр. {sourceB.page}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Материалы</p>
          <p className="mt-2 text-slate-700">{formatList(item.materials)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Процессы</p>
          <p className="mt-2 text-slate-700">{formatList(item.processes)}</p>
        </div>
      </div>

      <p className="mt-4 rounded border border-white/80 bg-white/80 p-3 text-sm leading-6 text-slate-700">
        <span className="font-semibold">Возможная причина и следующий шаг: </span>
        {item.contradiction.resolutionHint}
      </p>
    </article>
  );
}

function GapCard({ gap }: { gap: KnowledgeGap }) {
  return (
    <article className="rounded border border-amber-200 bg-amber-50/65 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{gap.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{gap.description}</p>
        </div>
        <StatusBadge label={gap.severity} tone={getSeverityTone(gap.severity)} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        <span className="font-semibold">Рекомендация: </span>
        {gap.recommendedAction}
      </p>
    </article>
  );
}

export function ContradictionsPage() {
  const [filters, setFilters] = useState<ContradictionFilters>(initialFilters);
  const filteredItems = useMemo(
    () => filterContradictionItems(contradictionStats.items, filters),
    [filters],
  );
  const sourceTypes = useMemo(
    () => Array.from(new Set(contradictionStats.items.flatMap((item) => item.sourceTypes))),
    [],
  );

  return (
    <div className="mx-auto max-w-[1680px] space-y-6">
      <section className="rounded border border-white/75 bg-white/76 p-7 shadow-glass backdrop-blur-2xl">
        <div className="grid grid-cols-[minmax(0,1fr)_390px] gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ice-600">
              Противоречия
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">
              Противоречия и слабые места доказательной базы
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
              Противоречия показывают конфликтующие утверждения, разные условия экспериментов
              или несовпадающие выводы источников. Это не ошибка системы, а точка для
              экспертной проверки.
            </p>
          </div>
          <div className="rounded border border-orange-200 bg-orange-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
              Принцип проверки
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-950">
              Конфликт источников должен быть виден до переноса вывода в отчет.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Всего противоречий"
          value={String(contradictionStats.total)}
          description="Структурированные конфликты утверждений в текущем корпусе."
          tone={contradictionStats.total > 0 ? "amber" : "green"}
        />
        <MetricCard
          label="Нужна проверка"
          value={String(contradictionStats.claimsNeedingReviewCount)}
          description="Утверждения, связанные с противоречиями."
          tone="amber"
        />
        <MetricCard
          label="Связанные пробелы"
          value={String(contradictionStats.relatedGapsCount)}
          description="Пробелы, которые могут снижать уверенность."
          tone="violet"
        />
        <MetricCard
          label="Критичные / средние"
          value={`${contradictionStats.severityCounts.critical}/${contradictionStats.severityCounts.moderate}`}
          description="Серьезные и умеренные конфликты."
          tone={contradictionStats.severityCounts.critical > 0 ? "red" : "amber"}
        />
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-6">
        <SectionCard title="Разбор противоречий" eyebrow="Конфликтующие доказательства">
          <div className="grid grid-cols-4 gap-3 rounded border border-slate-200 bg-slate-50 p-4">
            <label className="text-xs font-medium text-slate-600">
              Серьезность
              <select
                value={filters.severity}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    severity: event.target.value as ContradictionFilters["severity"],
                  })
                }
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Любая</option>
                <option value="minor">Низкая</option>
                <option value="moderate">Средняя</option>
                <option value="critical">Критичная</option>
              </select>
            </label>

            <label className="text-xs font-medium text-slate-600">
              Тема / материал
              <input
                type="search"
                value={filters.topic}
                onChange={(event) => setFilters({ ...filters, topic: event.target.value })}
                placeholder="nickel, catholyte..."
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="text-xs font-medium text-slate-600">
              Тип источника
              <select
                value={filters.sourceType}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    sourceType: event.target.value as "all" | SourceType,
                  })
                }
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Все типы</option>
                {sourceTypes.map((sourceType) => (
                  <option key={sourceType} value={sourceType}>
                    {getSourceTypeLabel(sourceType)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-slate-600">
              Поиск
              <input
                type="search"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                placeholder="описание, источник..."
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 space-y-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <ContradictionCard key={item.contradiction.id} item={item} />
              ))
            ) : (
              <div className="rounded border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
                По текущим фильтрам противоречия не найдены.
              </div>
            )}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Связанные пробелы" eyebrow="Слабые зоны">
            <div className="space-y-3">
              {contradictionStats.gaps.map((gap) => (
                <GapCard key={gap.id} gap={gap} />
              ))}
            </div>
          </SectionCard>

          <section className="rounded border border-graphite-800 bg-graphite-900 p-5 text-white shadow-glass">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ice-300">
              Следующий шаг
            </p>
            <h2 className="mt-2 text-xl font-semibold">Проверить доказательный контекст</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Откройте поиск доказательств или граф знаний, чтобы увидеть утверждения,
              источники и связи вокруг конфликта.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                to="/search"
                className="rounded border border-ice-300/30 bg-ice-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-ice-600"
              >
                Перейти к поиску доказательств
              </Link>
              <Link
                to="/graph"
                className="rounded border border-white/15 bg-white/8 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/14"
              >
                Открыть граф знаний
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
