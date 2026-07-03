import { useMemo, useState } from "react";
import type { ConfidenceLevel, SourceType } from "../../entities/source/types";
import {
  buildSourceStats,
  filterSourceItems,
  getSourceTypeLabel,
  type SourceFilters,
  type SourceListItem,
} from "../../shared/lib/sourceStats";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
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
          <div className="mt-2 h-2 overflow-hidden rounded bg-slate-100">
            <div
              className="h-full rounded bg-ice-500"
              style={{ width: `${Math.max((item.count / maxCount) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceCard({ item }: { item: SourceListItem }) {
  return (
    <details className="rounded border border-slate-200 bg-white/86 p-4 shadow-sm">
      <summary className="cursor-pointer list-none">
        <div className="grid grid-cols-[minmax(0,1fr)_140px_110px_120px] items-start gap-4">
          <div>
            <h3 className="text-base font-semibold leading-6 text-slate-950">{item.source.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.excerpt}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.source.tags.map((tag) => (
                <span key={tag} className="rounded border border-ice-100 bg-ice-50 px-2 py-1 text-xs text-ice-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{getSourceTypeLabel(item.source.sourceType)}</p>
            <p className="mt-1 text-xs text-slate-500">type</p>
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{item.source.year}</p>
            <p className="mt-1 text-xs text-slate-500">year</p>
          </div>
          <div className="flex justify-end">
            <ConfidenceBadge confidence={item.source.reliability} />
          </div>
        </div>
      </summary>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Authors</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.source.authors.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Language</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.language}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Geography</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.geography}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Related claims</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.relatedClaimsCount}</p>
          </div>
        </div>

        <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Linked claims / references
          </p>
          <div className="mt-3 space-y-3">
            {item.references.length > 0 ? (
              item.references.map((reference) => (
                <div key={reference.chunkId} className="rounded border border-white bg-white p-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm leading-6 text-slate-700">{reference.claimText}</p>
                    <ConfidenceBadge confidence={reference.confidence} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    p. {reference.page} / {reference.chunkId} / {reference.year}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Связанные claims не найдены.</p>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}

export function SourcesPage() {
  const [filters, setFilters] = useState<SourceFilters>(initialFilters);

  const filteredItems = useMemo(
    () => filterSourceItems(sourceStats.items, filters),
    [filters],
  );

  return (
    <div className="mx-auto max-w-[1680px] space-y-6">
      <section className="rounded border border-white/75 bg-white/76 p-7 shadow-glass backdrop-blur-2xl">
        <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ice-600">
              Sources
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">
              Доказательная база claims
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
              Источники связывают утверждения с конкретными документами, страницами и
              chunks. Эксперт может быстро увидеть тип источника, надежность и claims,
              которые он поддерживает.
            </p>
          </div>
          <div className="rounded border border-ice-100 bg-graphite-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-300">
              Evidence principle
            </p>
            <p className="mt-3 text-lg font-semibold">Фактическое утверждение должно иметь источник.</p>
          </div>
        </div>
      </section>

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
        <SectionCard title="Реестр источников" eyebrow="Source registry">
          <div className="grid grid-cols-5 gap-3 rounded border border-slate-200 bg-slate-50 p-4">
            <label className="text-xs font-medium text-slate-600">
              Source type
              <select
                value={filters.sourceType}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    sourceType: event.target.value as SourceFilters["sourceType"],
                  })
                }
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Все типы</option>
                {sourceStats.availableSourceTypes.map((sourceType) => (
                  <option key={sourceType} value={sourceType}>
                    {getSourceTypeLabel(sourceType)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-slate-600">
              Geography
              <select
                value={filters.geography}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    geography: event.target.value as SourceFilters["geography"],
                  })
                }
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Все</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>

            <label className="text-xs font-medium text-slate-600">
              Reliability
              <select
                value={filters.reliability}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    reliability: event.target.value as "all" | ConfidenceLevel,
                  })
                }
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Любая</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-medium text-slate-600">
                Year from
                <input
                  type="number"
                  value={filters.yearFrom}
                  onChange={(event) =>
                    setFilters({ ...filters, yearFrom: Number(event.target.value) })
                  }
                  className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Year to
                <input
                  type="number"
                  value={filters.yearTo}
                  onChange={(event) =>
                    setFilters({ ...filters, yearTo: Number(event.target.value) })
                  }
                  className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>

            <label className="text-xs font-medium text-slate-600">
              Search
              <input
                type="search"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                placeholder="Title, author, tag..."
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 space-y-3">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => <SourceCard key={item.source.id} item={item} />)
            ) : (
              <div className="rounded border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
                По текущим фильтрам источники не найдены. Измените тип, год или строку поиска.
              </div>
            )}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Coverage by type" eyebrow="Distribution">
            <DistributionBars items={sourceStats.typeDistribution} />
          </SectionCard>
          <SectionCard title="Reliability" eyebrow="Source confidence">
            <DistributionBars items={sourceStats.reliabilityDistribution} />
          </SectionCard>
          <SectionCard title="Read-only page" eyebrow="MVP status">
            <p className="text-sm leading-6 text-slate-600">
              Страница работает на mock data и не выполняет backend-запросы. География
              отмечена как unknown, потому что такого поля пока нет в текущем mock-контракте.
            </p>
            <div className="mt-4">
              <StatusBadge label="mock-first" tone="info" />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
