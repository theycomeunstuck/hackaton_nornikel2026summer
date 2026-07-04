import { useEffect, useId, useMemo, useState } from "react";
import type { ConfidenceLevel, SourceMetadata, SourceType } from "../../entities/source/types";
import { getSources, type SourceListItem as BackendSourceListItem } from "../../shared/api/appApi";
import {
  buildSourceStats,
  filterSourceItems,
  getSourceTypeLabel,
  type SourceFilters,
  type SourceListItem,
} from "../../shared/lib/sourceStats";
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
import { StatusBadge } from "../../shared/ui/StatusBadge";

const sourceStats = buildSourceStats();

const initialFilters: SourceFilters = {
  sourceType: "all",
  geography: "all",
  reliability: "all",
  yearFrom: sourceStats.yearRange.from,
  yearTo: sourceStats.yearRange.to,
  search: "",
};

const reliabilityOptions: FilterOption[] = [
  { value: "all", label: "Любая" },
  { value: "high", label: "Высокая" },
  { value: "medium", label: "Средняя" },
  { value: "low", label: "Низкая" },
];

const geographyOptions: FilterOption[] = [
  { value: "all", label: "Все значения" },
  { value: "unknown", label: "Не указана" },
];

function toSourceType(sourceType: string | null | undefined): SourceType {
  if (
    sourceType === "scientific_article" ||
    sourceType === "internal_report" ||
    sourceType === "patent" ||
    sourceType === "experiment_protocol" ||
    sourceType === "technical_standard" ||
    sourceType === "reference_book"
  ) {
    return sourceType;
  }

  if (sourceType === "publication") {
    return "scientific_article";
  }

  if (sourceType === "report") {
    return "internal_report";
  }

  if (sourceType === "experiment") {
    return "experiment_protocol";
  }

  if (sourceType === "standard") {
    return "technical_standard";
  }

  return "reference_book";
}

function toConfidenceLevel(value: string | null | undefined): ConfidenceLevel {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return "medium";
}

function getBackendSourceTitle(source: BackendSourceListItem): string {
  return source.title ?? source.sourceName ?? source.documentId ?? "Источник без названия";
}

function adaptBackendSourceItems(sources: BackendSourceListItem[]): SourceListItem[] {
  return sources.map((source, index) => {
    const title = getBackendSourceTitle(source);
    const sourceId =
      source.id ??
      source.documentId ??
      source.sourceName ??
      source.chunkId ??
      `backend-source-${index}`;
    const sourceMetadata: SourceMetadata = {
      id: sourceId,
      title,
      sourceType: toSourceType(source.sourceType),
      year: source.year ?? new Date().getFullYear(),
      authors: source.authors ?? [],
      organization: source.organization ?? undefined,
      documentId: source.documentId ?? undefined,
      tags: source.tags ?? [],
      reliability: toConfidenceLevel(source.reliability),
    };
    const hasReference =
      source.page !== null || source.chunkId !== null || source.documentId !== null;

    return {
      source: sourceMetadata,
      language: source.language === "ru" || source.language === "en" ? source.language : "unknown",
      geography: source.geography ?? "unknown",
      relatedClaimsCount: hasReference ? 1 : 0,
      excerpt: source.excerpt ?? source.sectionTitle ?? "Фрагмент для источника не найден.",
      references: hasReference
        ? [
            {
              claimId: `${sourceId}-reference`,
              claimText: source.excerpt ?? source.sectionTitle ?? title,
              confidence: sourceMetadata.reliability,
              page: source.page ?? 0,
              chunkId: source.chunkId ?? "chunk не указан",
              year: sourceMetadata.year,
            },
          ]
        : [],
    };
  });
}

function DistributionBars({ items }: { items: Array<{ label: string; count: number }> }) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{item.count}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-ice-500"
              style={{ width: `${Math.max((item.count / maxCount) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceCard({ item }: { item: SourceListItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();
  const languageLabel =
    item.language === "en" ? "английский" : item.language === "ru" ? "русский" : "не указан";
  const geographyLabel = item.geography === "unknown" ? "не указана" : item.geography;

  return (
    <article className="rounded-xl border border-slate-200 bg-white/86 shadow-sm motion-ui-transition hover:border-ice-100 hover:shadow-glass">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-expanded={isOpen}
        aria-controls={detailsId}
        className="block w-full rounded-xl p-4 text-left outline-none motion-ui-transition hover:bg-ice-50/30 focus-visible:ring-4 focus-visible:ring-ice-100"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_140px_110px_120px_120px] items-start gap-4">
          <div>
            <h3 className="text-base font-semibold leading-6 text-slate-950">{item.source.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.excerpt}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.source.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-ice-100 bg-ice-50 px-2.5 py-1 text-xs text-ice-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{getSourceTypeLabel(item.source.sourceType)}</p>
            <p className="mt-1 text-xs text-slate-500">тип</p>
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{item.source.year}</p>
            <p className="mt-1 text-xs text-slate-500">год</p>
          </div>
          <div className="flex justify-end">
            <ConfidenceBadge confidence={item.source.reliability} />
          </div>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-ice-100 bg-ice-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ice-700">
              {isOpen ? "Свернуть" : "Подробнее"}
              <span
                className="motion-chevron block h-2 w-2 border-b-2 border-r-2 border-current"
                style={{ transform: isOpen ? "rotate(-135deg)" : "rotate(45deg)" }}
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </button>

      <div
        id={detailsId}
        className={`motion-collapsible-grid ${isOpen ? "motion-collapsible-grid-open" : ""}`}
      >
        <div className="motion-collapsible-inner">
          <div
            className={`border-t border-slate-200 px-4 py-4 motion-reveal-transition ${
              isOpen
                ? "visible translate-y-0 opacity-100"
                : "-translate-y-1 opacity-0 pointer-events-none"
            }`}
            aria-hidden={!isOpen}
          >
            <div className="grid grid-cols-5 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Авторы</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.source.authors.join(", ")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Document ID</p>
                <p className="mt-2 break-all text-sm leading-6 text-slate-700">
                  {item.source.documentId ?? "не указан"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Язык</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{languageLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">География</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{geographyLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Связанные утверждения</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.relatedClaimsCount}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Связанные утверждения и ссылки
              </p>
              <div className="mt-3 space-y-3">
                {item.references.length > 0 ? (
                  item.references.map((reference) => (
                    <div key={reference.chunkId} className="rounded-xl border border-white bg-white p-3">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm leading-6 text-slate-700">{reference.claimText}</p>
                        <ConfidenceBadge confidence={reference.confidence} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        стр. {reference.page} / {reference.chunkId} / {reference.year}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Связанные утверждения не найдены.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function SourcesHeaderAside() {
  return (
    <div className="rounded-xl border border-ice-100 bg-ice-50/75 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
        Принцип доказательности
      </p>
      <p className="mt-3 text-lg font-semibold text-slate-950">
        Фактическое утверждение должно иметь источник.
      </p>
    </div>
  );
}

export function SourcesPage() {
  const [filters, setFilters] = useState<SourceFilters>(initialFilters);
  const [backendItems, setBackendItems] = useState<SourceListItem[] | null>(null);
  const [isSourcesLoading, setIsSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const activeItems = backendItems ?? sourceStats.items;

  const filteredItems = useMemo(
    () => filterSourceItems(activeItems, filters),
    [activeItems, filters],
  );
  const sourceTypeOptions: FilterOption[] = [
    { value: "all", label: "Все типы" },
    ...sourceStats.availableSourceTypes.map((sourceType) => ({
      value: sourceType,
      label: getSourceTypeLabel(sourceType),
    })),
  ];

  useEffect(() => {
    let isActive = true;

    setIsSourcesLoading(true);
    getSources()
      .then((sources) => {
        if (!isActive) {
          return;
        }

        setBackendItems(adaptBackendSourceItems(sources));
        setSourcesError(null);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setBackendItems(null);
        setSourcesError("Backend-источники недоступны, показаны локальные данные.");
      })
      .finally(() => {
        if (isActive) {
          setIsSourcesLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <ContentContainer>
      <EvidencePageHeader
        eyebrow="Источники"
        title="Доказательная база утверждений"
        description="Источники связывают утверждения с конкретными документами, страницами и фрагментами. Страница помогает быстро увидеть тип источника, надёжность и поддерживаемые утверждения."
        aside={<SourcesHeaderAside />}
      />

      <section className="grid grid-cols-4 gap-4">
        {sourceStats.metrics.slice(0, 8).map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
            tone={metric.tone}
          />
        ))}
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-6">
        <SectionCard title="Реестр источников" eyebrow="Проверяемые ссылки">
          <div className="mb-4 rounded-xl border border-ice-100 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm">
            {isSourcesLoading ? (
              <span className="text-ice-700">Загрузка источников из /api/sources...</span>
            ) : sourcesError ? (
              <span className="text-amber-700">{sourcesError}</span>
            ) : activeItems.length === 0 ? (
              <span className="text-amber-700">Источники пока не найдены.</span>
            ) : (
              <span className="text-emerald-700">Источники обновлены из /api/sources.</span>
            )}
          </div>

          <FilterPanel
            title="Фильтры источников"
            description="Проверьте корпус по типу документа, надёжности и году публикации."
            action={<ResetFiltersButton label="Очистить фильтры" onClick={() => setFilters(initialFilters)} />}
            columnsClassName="grid-cols-5"
          >
            <FilterField label="Тип источника">
              <FilterSelect
                value={filters.sourceType}
                options={sourceTypeOptions}
                onChange={(value) =>
                  setFilters({ ...filters, sourceType: value as SourceFilters["sourceType"] })
                }
              />
            </FilterField>

            <FilterField label="География">
              <FilterSelect
                value={filters.geography}
                options={geographyOptions}
                onChange={(value) =>
                  setFilters({ ...filters, geography: value as SourceFilters["geography"] })
                }
              />
            </FilterField>

            <FilterField label="Надёжность">
              <FilterSelect
                value={filters.reliability}
                options={reliabilityOptions}
                onChange={(value) =>
                  setFilters({ ...filters, reliability: value as "all" | ConfidenceLevel })
                }
              />
            </FilterField>

            <div className="grid grid-cols-2 gap-2">
              <FilterField label="Год от">
                <FilterInput
                  type="number"
                  value={filters.yearFrom}
                  onChange={(event) =>
                    setFilters({ ...filters, yearFrom: Number(event.target.value) })
                  }
                />
              </FilterField>
              <FilterField label="Год до">
                <FilterInput
                  type="number"
                  value={filters.yearTo}
                  onChange={(event) =>
                    setFilters({ ...filters, yearTo: Number(event.target.value) })
                  }
                />
              </FilterField>
            </div>

            <FilterField label="Поиск по тексту">
              <FilterInput
                type="search"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                placeholder="название, автор, тег"
              />
            </FilterField>
          </FilterPanel>

          <div className="mt-4 space-y-3">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => <SourceCard key={item.source.id} item={item} />)
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
                По текущим фильтрам источники не найдены. Измените тип, год или строку поиска.
              </div>
            )}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Покрытие по типу" eyebrow="Распределение">
            <DistributionBars items={sourceStats.typeDistribution} />
          </SectionCard>
          <SectionCard title="Надёжность" eyebrow="Качество источников">
            <DistributionBars items={sourceStats.reliabilityDistribution} />
          </SectionCard>
          <SectionCard title="Режим просмотра" eyebrow="Статус раздела">
            <p className="text-sm leading-6 text-slate-600">
              Страница показывает сведения из текущего индекса доказательств. География отмечена
              как не указанная, если она отсутствует в данных источника.
            </p>
            <div className="mt-4">
              <StatusBadge label="только просмотр" tone="info" />
            </div>
          </SectionCard>
        </div>
      </div>
    </ContentContainer>
  );
}
