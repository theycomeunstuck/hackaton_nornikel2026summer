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
import { ContentContainer } from "../../shared/ui/ContentContainer";
import { EvidencePageHeader } from "../../shared/ui/EvidencePageHeader";
import { FilterField } from "../../shared/ui/filters/FilterField";
import { FilterInput } from "../../shared/ui/filters/FilterInput";
import { FilterPanel } from "../../shared/ui/filters/FilterPanel";
import { FilterSelect, type FilterOption } from "../../shared/ui/filters/FilterSelect";
import { ResetFiltersButton } from "../../shared/ui/filters/ResetFiltersButton";
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

const severityOptions: FilterOption[] = [
  { value: "all", label: "Любая" },
  { value: "minor", label: "Низкая" },
  { value: "moderate", label: "Средняя" },
  { value: "critical", label: "Критичная" },
];

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
    <article className="rounded-xl border border-orange-200 bg-orange-50/60 p-5 shadow-sm">
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
        <div className="rounded-xl border border-white/80 bg-white/86 p-4">
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
        <div className="rounded-xl border border-white/80 bg-white/86 p-4">
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

      <p className="mt-4 rounded-xl border border-white/80 bg-white/80 p-3 text-sm leading-6 text-slate-700">
        <span className="font-semibold">Возможная причина и следующий шаг: </span>
        {item.contradiction.resolutionHint}
      </p>
    </article>
  );
}

function GapCard({ gap }: { gap: KnowledgeGap }) {
  return (
    <article className="rounded-xl border border-amber-200 bg-amber-50/65 p-4">
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

function ContradictionsHeaderAside() {
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
        Принцип проверки
      </p>
      <p className="mt-3 text-lg font-semibold text-slate-950">
        Конфликт источников должен быть виден до переноса вывода в отчёт.
      </p>
    </div>
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
  const sourceTypeOptions: FilterOption[] = [
    { value: "all", label: "Все типы" },
    ...sourceTypes.map((sourceType) => ({
      value: sourceType,
      label: getSourceTypeLabel(sourceType),
    })),
  ];

  return (
    <ContentContainer>
      <EvidencePageHeader
        eyebrow="Противоречия"
        title="Противоречия и слабые места доказательной базы"
        description="Противоречия показывают конфликтующие утверждения, разные условия экспериментов или несовпадающие выводы источников. Это не ошибка системы, а точка для экспертной проверки."
        aside={<ContradictionsHeaderAside />}
      />

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
          description="Серьёзные и умеренные конфликты."
          tone={contradictionStats.severityCounts.critical > 0 ? "red" : "amber"}
        />
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-6">
        <SectionCard title="Разбор противоречий" eyebrow="Конфликтующие доказательства">
          <FilterPanel
            title="Фильтры противоречий"
            description="Отберите конфликты по серьёзности, теме, источнику или тексту описания."
            action={<ResetFiltersButton label="Очистить фильтры" onClick={() => setFilters(initialFilters)} />}
            columnsClassName="grid-cols-4"
          >
            <FilterField label="Серьёзность">
              <FilterSelect
                value={filters.severity}
                options={severityOptions}
                onChange={(value) =>
                  setFilters({ ...filters, severity: value as ContradictionFilters["severity"] })
                }
              />
            </FilterField>

            <FilterField label="Материал или процесс">
              <FilterInput
                type="search"
                value={filters.topic}
                onChange={(event) => setFilters({ ...filters, topic: event.target.value })}
                placeholder="никель, католит"
              />
            </FilterField>

            <FilterField label="Тип источника">
              <FilterSelect
                value={filters.sourceType}
                options={sourceTypeOptions}
                onChange={(value) =>
                  setFilters({ ...filters, sourceType: value as "all" | SourceType })
                }
              />
            </FilterField>

            <FilterField label="Поиск по тексту">
              <FilterInput
                type="search"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                placeholder="описание или источник"
              />
            </FilterField>
          </FilterPanel>

          <div className="mt-4 space-y-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <ContradictionCard key={item.contradiction.id} item={item} />
              ))
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
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

          <section className="rounded-xl border border-graphite-800 bg-graphite-900 p-5 text-white shadow-glass">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ice-300">
              Следующий шаг
            </p>
            <h2 className="mt-2 text-xl font-semibold">Проверить доказательный контекст</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Откройте поиск доказательств или граф знаний, чтобы увидеть утверждения, источники и
              связи вокруг конфликта.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                to="/search"
                className="rounded-xl border border-ice-300/30 bg-ice-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-ice-600"
              >
                Перейти к поиску
              </Link>
              <Link
                to="/graph"
                className="rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/14"
              >
                Открыть граф
              </Link>
            </div>
          </section>
        </div>
      </div>
    </ContentContainer>
  );
}
