import type { ConfidenceLevel, SourceType } from "../../entities/source/types";
import { FilterField } from "../../shared/ui/filters/FilterField";
import { FilterInput } from "../../shared/ui/filters/FilterInput";
import { FilterPanel } from "../../shared/ui/filters/FilterPanel";
import { FilterSelect, type FilterOption } from "../../shared/ui/filters/FilterSelect";
import { ResetFiltersButton } from "../../shared/ui/filters/ResetFiltersButton";

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
  onReset?: () => void;
};

const sourceTypeLabel: Record<SourceType, string> = {
  scientific_article: "Научная статья",
  internal_report: "Внутренний отчет",
  patent: "Патент",
  experiment_protocol: "Протокол эксперимента",
  technical_standard: "Технический стандарт",
  reference_book: "Справочник",
};

const confidenceOptions: FilterOption[] = [
  { value: "all", label: "Любая" },
  { value: "high", label: "Высокая" },
  { value: "medium", label: "Средняя" },
  { value: "low", label: "Низкая" },
];

const geographyOptions: FilterOption[] = [
  { value: "all", label: "Все площадки" },
  { value: "arctic", label: "Арктический кластер" },
  { value: "lab", label: "Лабораторные данные" },
  { value: "pilot", label: "Пилотные испытания" },
];

export function FiltersPanel({ filters, sourceTypes, onChange, onReset }: FiltersPanelProps) {
  const sourceTypeOptions: FilterOption[] = [
    { value: "all", label: "Все типы" },
    ...sourceTypes.map((sourceType) => ({
      value: sourceType,
      label: sourceTypeLabel[sourceType],
    })),
  ];

  return (
    <FilterPanel
      title="Ограничения поиска"
      description="Уточните выдачу по источникам, достоверности и периоду."
      action={onReset ? <ResetFiltersButton onClick={onReset} /> : null}
      columnsClassName="grid-cols-4"
    >
      <FilterField label="География">
        <FilterSelect
          value={filters.geography}
          options={geographyOptions}
          onChange={(value) => onChange({ ...filters, geography: value })}
        />
      </FilterField>

      <FilterField label="Тип источника">
        <FilterSelect
          value={filters.sourceType}
          options={sourceTypeOptions}
          onChange={(value) =>
            onChange({ ...filters, sourceType: value as EvidenceFilters["sourceType"] })
          }
        />
      </FilterField>

      <FilterField label="Достоверность">
        <FilterSelect
          value={filters.confidence}
          options={confidenceOptions}
          onChange={(value) =>
            onChange({ ...filters, confidence: value as EvidenceFilters["confidence"] })
          }
        />
      </FilterField>

      <div className="grid grid-cols-2 gap-2">
        <FilterField label="Год от">
          <FilterInput
            type="number"
            value={filters.yearFrom}
            onChange={(event) => onChange({ ...filters, yearFrom: Number(event.target.value) })}
          />
        </FilterField>
        <FilterField label="Год до">
          <FilterInput
            type="number"
            value={filters.yearTo}
            onChange={(event) => onChange({ ...filters, yearTo: Number(event.target.value) })}
          />
        </FilterField>
      </div>
    </FilterPanel>
  );
}
