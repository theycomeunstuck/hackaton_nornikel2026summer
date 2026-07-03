import type { ConfidenceLevel, SourceType } from "../../entities/source/types";

export type EvidenceFilters = {
  geography: string;
  sourceType: "all" | SourceType;
  confidence: "all" | ConfidenceLevel;
  yearFrom: number;
  yearTo: number;
};

type FiltersPanelProps = {
  filters: EvidenceFilters;
  sourceTypes: SourceType[];
  onChange: (filters: EvidenceFilters) => void;
};

const sourceTypeLabel: Record<SourceType, string> = {
  scientific_article: "Scientific article",
  internal_report: "Internal report",
  patent: "Patent",
  experiment_protocol: "Experiment protocol",
  technical_standard: "Technical standard",
  reference_book: "Reference book",
};

export function FiltersPanel({ filters, sourceTypes, onChange }: FiltersPanelProps) {
  return (
    <section className="rounded border border-white/75 bg-white/66 p-4 shadow-glass backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Evidence filters
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">Фильтры корпуса</h3>
        </div>
        <span className="rounded border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          mock data
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        <label className="text-xs font-medium text-slate-600">
          Geography
          <select
            value={filters.geography}
            onChange={(event) => onChange({ ...filters, geography: event.target.value })}
            className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">Все площадки</option>
            <option value="arctic">Арктический кластер</option>
            <option value="lab">Лабораторные данные</option>
            <option value="pilot">Пилотные испытания</option>
          </select>
        </label>

        <label className="text-xs font-medium text-slate-600">
          Source type
          <select
            value={filters.sourceType}
            onChange={(event) =>
              onChange({ ...filters, sourceType: event.target.value as EvidenceFilters["sourceType"] })
            }
            className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">Все типы</option>
            {sourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {sourceTypeLabel[sourceType]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-slate-600">
          Confidence
          <select
            value={filters.confidence}
            onChange={(event) =>
              onChange({ ...filters, confidence: event.target.value as EvidenceFilters["confidence"] })
            }
            className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">Любой</option>
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
              onChange={(event) => onChange({ ...filters, yearFrom: Number(event.target.value) })}
              className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Year to
            <input
              type="number"
              value={filters.yearTo}
              onChange={(event) => onChange({ ...filters, yearTo: Number(event.target.value) })}
              className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
