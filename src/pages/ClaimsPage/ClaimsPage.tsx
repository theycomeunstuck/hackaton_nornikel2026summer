import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClaimCard } from "../../entities/claim/components/ClaimCard";
import type { ConfidenceLevel, SourceType } from "../../entities/source/types";
import {
  buildClaimStats,
  filterClaimItems,
  type ClaimFilters,
  type ClaimStatus,
} from "../../shared/lib/claimStats";
import { FilterChip } from "../../shared/ui/filters/FilterChip";
import { FilterField } from "../../shared/ui/filters/FilterField";
import { FilterInput } from "../../shared/ui/filters/FilterInput";
import { FilterPanel } from "../../shared/ui/filters/FilterPanel";
import { FilterSelect, type FilterOption } from "../../shared/ui/filters/FilterSelect";
import { ResetFiltersButton } from "../../shared/ui/filters/ResetFiltersButton";
import { MetricCard } from "../../shared/ui/MetricCard";
import { SectionCard } from "../../shared/ui/SectionCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

const claimStats = buildClaimStats();

const sourceTypeLabel: Record<SourceType, string> = {
  scientific_article: "Научная статья",
  internal_report: "Внутренний отчет",
  patent: "Патент",
  experiment_protocol: "Протокол эксперимента",
  technical_standard: "Технический стандарт",
  reference_book: "Справочник",
};

const statusFilterLabel: Record<ClaimStatus, string> = {
  confirmed: "Подтверждено",
  weakly_supported: "Слабая поддержка",
  conflicting: "Конфликт",
  new: "Новое",
  needs_review: "Нужна проверка",
};

const initialFilters: ClaimFilters = {
  scenarioId: "all",
  status: "all",
  confidence: "all",
  material: "",
  process: "",
  sourceType: "all",
  search: "",
};

const confidenceOptions: FilterOption[] = [
  { value: "all", label: "Любая" },
  { value: "high", label: "Высокая" },
  { value: "medium", label: "Средняя" },
  { value: "low", label: "Низкая" },
];

export function ClaimsPage() {
  const [filters, setFilters] = useState<ClaimFilters>(initialFilters);

  const filteredItems = useMemo(
    () => filterClaimItems(claimStats.items, filters),
    [filters],
  );
  const scenarioOptions: FilterOption[] = [
    { value: "all", label: "Все направления" },
    ...claimStats.availableScenarios.map((scenario) => ({
      value: scenario.id,
      label: scenario.title,
    })),
  ];
  const statusOptions: FilterOption[] = [
    { value: "all", label: "Любой" },
    ...Object.entries(statusFilterLabel).map(([value, label]) => ({ value, label })),
  ];
  const sourceTypeOptions: FilterOption[] = [
    { value: "all", label: "Все типы" },
    ...claimStats.availableSourceTypes.map((sourceType) => ({
      value: sourceType,
      label: sourceTypeLabel[sourceType],
    })),
  ];

  return (
    <div className="mx-auto max-w-[1680px] space-y-6">
      <section className="rounded border border-white/75 bg-white/76 p-7 shadow-glass backdrop-blur-2xl">
        <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ice-600">
              База утверждений
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">
              Проверяемые научно-технические утверждения
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
              Раздел показывает накопленные научно-технические утверждения, каждое
              из которых связано с источником, условиями, уверенностью и возможными
              ограничениями.
            </p>
          </div>
          <div className="rounded border border-ice-100 bg-graphite-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-300">
              Принцип доказательности
            </p>
            <p className="mt-3 text-lg font-semibold">
              Нет источника - нет фактического утверждения.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-4">
        {claimStats.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
            tone={metric.tone}
          />
        ))}
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-6">
        <SectionCard title="Реестр утверждений" eyebrow="Доказательные карточки">
          <FilterPanel
            title="Фильтры базы утверждений"
            description="Сузьте список по направлению, статусу, источнику и тексту утверждения."
            action={<ResetFiltersButton label="Очистить фильтры" onClick={() => setFilters(initialFilters)} />}
            columnsClassName="grid-cols-6"
          >
            <FilterField label="Направление">
              <FilterSelect
                value={filters.scenarioId}
                options={scenarioOptions}
                onChange={(value) => setFilters({ ...filters, scenarioId: value })}
              />
            </FilterField>

            <FilterField label="Статус">
              <FilterSelect
                value={filters.status}
                options={statusOptions}
                onChange={(value) =>
                  setFilters({ ...filters, status: value as "all" | ClaimStatus })
                }
              />
            </FilterField>

            <FilterField label="Достоверность">
              <FilterSelect
                value={filters.confidence}
                options={confidenceOptions}
                onChange={(value) =>
                  setFilters({ ...filters, confidence: value as "all" | ConfidenceLevel })
                }
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

            <FilterField label="Материал">
              <FilterInput
                value={filters.material}
                onChange={(event) => setFilters({ ...filters, material: event.target.value })}
                placeholder="например: Ni, Au, Ca"
              />
            </FilterField>

            <FilterField label="Поиск по тексту">
              <FilterInput
                type="search"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                placeholder="утверждение или процесс"
              />
            </FilterField>

            <FilterField label="Материал или процесс" className="col-span-2">
              <FilterInput
                value={filters.process}
                onChange={(event) => setFilters({ ...filters, process: event.target.value })}
                placeholder="например: электроэкстракция"
              />
            </FilterField>
            <div className="col-span-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Быстрый выбор материалов
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {claimStats.availableMaterials.slice(0, 14).map((material) => (
                  <FilterChip
                    key={material}
                    label={material}
                    active={filters.material === material}
                    onClick={() => setFilters({ ...filters, material })}
                  />
                ))}
              </div>
            </div>
          </FilterPanel>

          <div className="mt-5 space-y-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => <ClaimCard key={item.claim.id} item={item} />)
            ) : (
              <div className="rounded border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
                По текущим фильтрам утверждения не найдены. Измените статус, уверенность,
                материал или строку поиска.
              </div>
            )}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Логика статусов" eyebrow="Как формируются метки">
            <div className="space-y-3 text-sm leading-6 text-slate-700">
              <div className="flex items-start gap-3">
                <StatusBadge label="подтверждено" tone="success" />
                <span>Высокая уверенность без связанных противоречий и пробелов.</span>
              </div>
              <div className="flex items-start gap-3">
                <StatusBadge label="слабая поддержка" tone="warning" />
                <span>Средняя или низкая уверенность без явного конфликта.</span>
              </div>
              <div className="flex items-start gap-3">
                <StatusBadge label="конфликт" tone="danger" />
                <span>Утверждение напрямую связано с противоречием.</span>
              </div>
              <div className="flex items-start gap-3">
                <StatusBadge label="нужна проверка" tone="warning" />
                <span>Утверждение затрагивает направление, материал или процесс с пробелом.</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Группировка по направлениям" eyebrow="Рабочие сценарии">
            <div className="space-y-3">
              {claimStats.availableScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => setFilters({ ...filters, scenarioId: scenario.id })}
                  className="w-full rounded border border-slate-200 bg-white/80 p-3 text-left text-sm font-semibold text-slate-800 transition hover:border-ice-200 hover:bg-ice-50"
                >
                  {scenario.title}
                </button>
              ))}
            </div>
          </SectionCard>

          <section className="rounded border border-graphite-800 bg-graphite-900 p-5 text-white shadow-glass">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ice-300">
              Следующий шаг
            </p>
            <h2 className="mt-2 text-xl font-semibold">Проверить утверждение в контексте</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Перейдите к поиску доказательств, графу или источникам, чтобы проверить
              ссылки и связи.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3">
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
              <Link
                to="/sources"
                className="rounded border border-white/15 bg-white/8 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/14"
              >
                Посмотреть источники
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
