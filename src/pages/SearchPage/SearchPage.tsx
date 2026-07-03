import { useMemo, useState } from "react";
import type { EvidenceClaim } from "../../entities/claim/types";
import type { SourceType } from "../../entities/source/types";
import { demoScenarios } from "../../shared/mock/demoScenarios.mock";
import { mockSearchResults } from "../../shared/mock/searchResults.mock";
import type { DemoScenario, SearchResult } from "../../shared/types/search";
import { DisclosureSection } from "../../shared/ui/DisclosureSection";
import { KnowledgeGraph } from "../../widgets/graph/KnowledgeGraph";
import { AnswerSummaryCard } from "../../widgets/result/AnswerSummaryCard";
import { ContradictionsPanel } from "../../widgets/result/ContradictionsPanel";
import { EvidenceTable } from "../../widgets/result/EvidenceTable";
import { ExportPanel } from "../../widgets/result/ExportPanel";
import { GapsPanel } from "../../widgets/result/GapsPanel";
import { ParsedQueryCard } from "../../widgets/result/ParsedQueryCard";
import { SourcesPanel } from "../../widgets/result/SourcesPanel";
import { DemoScenarioButtons } from "../../widgets/search/DemoScenarioButtons";
import { type EvidenceFilters, FiltersPanel } from "../../widgets/search/FiltersPanel";
import { SearchPanel } from "../../widgets/search/SearchPanel";

const initialResult = mockSearchResults[0];

const initialFilters: EvidenceFilters = {
  geography: "all",
  sourceType: "all",
  confidence: "all",
  yearFrom: 2020,
  yearTo: 2026,
};

function getResultByScenario(scenario: DemoScenario): SearchResult {
  return (
    mockSearchResults.find((result) => result.id === scenario.searchResultId) ?? initialResult
  );
}

function filterClaims(claims: EvidenceClaim[], filters: EvidenceFilters): EvidenceClaim[] {
  return claims.filter((claim) => {
    const matchesConfidence =
      filters.confidence === "all" || claim.confidence === filters.confidence;
    const matchesSourceType =
      filters.sourceType === "all" || claim.sourceRef.sourceType === filters.sourceType;
    const matchesYear = claim.year >= filters.yearFrom && claim.year <= filters.yearTo;

    return matchesConfidence && matchesSourceType && matchesYear;
  });
}

function getSourceTypes(result: SearchResult): SourceType[] {
  return Array.from(new Set(result.sources.map((source) => source.sourceType)));
}

export function SearchPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult>(initialResult);
  const [query, setQuery] = useState<string>(initialResult.parsedQuery.originalText);
  const [filters, setFilters] = useState<EvidenceFilters>(initialFilters);

  const filteredClaims = useMemo(
    () => filterClaims(selectedResult.evidence, filters),
    [filters, selectedResult.evidence],
  );

  const filteredSourceIds = useMemo(
    () => new Set(filteredClaims.map((claim) => claim.sourceRef.sourceId)),
    [filteredClaims],
  );

  const filteredSources = useMemo(
    () => selectedResult.sources.filter((source) => filteredSourceIds.has(source.id)),
    [filteredSourceIds, selectedResult.sources],
  );

  const sourceTypes = useMemo(() => getSourceTypes(selectedResult), [selectedResult]);
  const selectedScenario = useMemo(
    () => demoScenarios.find((scenario) => scenario.id === selectedResult.scenarioId),
    [selectedResult.scenarioId],
  );

  const handleScenarioSelect = (scenario: DemoScenario) => {
    const nextResult = getResultByScenario(scenario);
    setSelectedResult(nextResult);
    setQuery(scenario.defaultQuery);
    setFilters(initialFilters);
  };

  const handleSearch = () => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchedScenario = demoScenarios.find((scenario) =>
      scenario.defaultQuery.toLowerCase().includes(normalizedQuery),
    );

    if (matchedScenario) {
      setSelectedResult(getResultByScenario(matchedScenario));
    }
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-6">
      <SearchPanel query={query} onQueryChange={setQuery} onSearch={handleSearch} />

      <DemoScenarioButtons
        scenarios={demoScenarios}
        selectedScenarioId={selectedResult.scenarioId}
        onSelect={handleScenarioSelect}
      />

      <DisclosureSection
        title="Фильтры"
        eyebrow="Уточнение выдачи"
        summary="Можно ограничить доказательства по типу источника, уровню достоверности и году публикации."
      >
        <FiltersPanel
          filters={filters}
          sourceTypes={sourceTypes}
          onChange={setFilters}
          onReset={() => setFilters(initialFilters)}
        />
      </DisclosureSection>

      <section className="grid grid-cols-[minmax(0,1fr)_minmax(360px,0.36fr)] gap-6">
        <AnswerSummaryCard answer={selectedResult.answer} />
        <div className="rounded border border-ice-100 bg-ice-50/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ice-600">
            Последовательность проверки
          </p>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li className="flex gap-3">
              <span className="font-semibold text-ice-600">1</span>
              <span>Сначала читается краткий вывод и уровень достоверности.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-ice-600">2</span>
              <span>Затем проверяются утверждения в таблице доказательств.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-ice-600">3</span>
              <span>Граф, источники, противоречия и экспорт открываются ниже по необходимости.</span>
            </li>
          </ol>
        </div>
      </section>

      <EvidenceTable claims={filteredClaims} />

      <div className="space-y-4">
        <DisclosureSection
          title="Как разобран запрос"
          eyebrow="Структура запроса"
          summary="Интент, материалы, процессы, технологии, условия и временной диапазон."
        >
          <ParsedQueryCard parsedQuery={selectedResult.parsedQuery} />
        </DisclosureSection>

        <DisclosureSection
          title="Граф связей"
          eyebrow="Визуальная проверка"
          summary="Связи между утверждениями, материалами, условиями, эффектами и источниками."
        >
          <KnowledgeGraph
            graph={selectedResult.graph}
            contradictions={selectedResult.contradictions}
            gaps={selectedResult.gaps}
            mode="compact"
          />
        </DisclosureSection>

        <DisclosureSection
          title="Источники"
          eyebrow="Доказательная база"
          summary="Список источников, которые поддерживают видимые утверждения."
        >
          <SourcesPanel sources={filteredSources} claims={filteredClaims} />
        </DisclosureSection>

        <DisclosureSection
          title="Противоречия и пробелы"
          eyebrow="Что требует проверки"
          summary="Конфликтующие выводы и недостающие данные для экспертной проверки."
        >
          <div className="grid grid-cols-2 gap-6">
            <ContradictionsPanel contradictions={selectedResult.contradictions} />
            <GapsPanel gaps={selectedResult.gaps} />
          </div>
        </DisclosureSection>

        <DisclosureSection
          title="Экспорт отчета"
          eyebrow="Сохранение результата"
          summary="Скачивание текущего результата в Markdown или JSON."
        >
          <ExportPanel
            query={query}
            result={selectedResult}
            scenarioTitle={selectedScenario?.title}
          />
        </DisclosureSection>
      </div>
    </div>
  );
}
