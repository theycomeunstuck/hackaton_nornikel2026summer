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

export function ClaimsPage() {
  const [filters, setFilters] = useState<ClaimFilters>(initialFilters);

  const filteredItems = useMemo(
    () => filterClaimItems(claimStats.items, filters),
    [filters],
  );

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
          <div className="grid grid-cols-6 gap-3 rounded border border-slate-200 bg-slate-50 p-4">
            <label className="text-xs font-medium text-slate-600">
              Направление
              <select
                value={filters.scenarioId}
                onChange={(event) => setFilters({ ...filters, scenarioId: event.target.value })}
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Все направления</option>
                {claimStats.availableScenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-slate-600">
              Статус
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters({ ...filters, status: event.target.value as "all" | ClaimStatus })
                }
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Любой</option>
                {Object.entries(statusFilterLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-slate-600">
              Уверенность
              <select
                value={filters.confidence}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    confidence: event.target.value as "all" | ConfidenceLevel,
                  })
                }
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Любая</option>
                <option value="high">Высокая</option>
                <option value="medium">Средняя</option>
                <option value="low">Низкая</option>
              </select>
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
                {claimStats.availableSourceTypes.map((sourceType) => (
                  <option key={sourceType} value={sourceType}>
                    {sourceTypeLabel[sourceType]}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-slate-600">
              Материал
              <input
                value={filters.material}
                onChange={(event) => setFilters({ ...filters, material: event.target.value })}
                placeholder="Ca, Ni, Au..."
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="text-xs font-medium text-slate-600">
              Поиск
              <input
                type="search"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                placeholder="утверждение, процесс..."
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-[260px_minmax(0,1fr)] gap-3 rounded border border-slate-200 bg-white/70 p-4">
            <label className="text-xs font-medium text-slate-600">
              Фильтр по процессу
              <input
                value={filters.process}
                onChange={(event) => setFilters({ ...filters, process: event.target.value })}
                placeholder="electrowinning, smelting..."
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Быстрый выбор материалов
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {claimStats.availableMaterials.slice(0, 14).map((material) => (
                  <button
                    key={material}
                    type="button"
                    onClick={() => setFilters({ ...filters, material })}
                    className="rounded border border-ice-100 bg-ice-50 px-2.5 py-1 text-xs font-medium text-ice-600 transition hover:border-ice-300"
                  >
                    {material}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
