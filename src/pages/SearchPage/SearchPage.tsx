import { useMemo, useState } from "react";
import type { EvidenceClaim } from "../../entities/claim/types";
import type { SourceType } from "../../entities/source/types";
import { demoScenarios } from "../../shared/mock/demoScenarios.mock";
import { mockSearchResults } from "../../shared/mock/searchResults.mock";
import type { DemoScenario, SearchResult } from "../../shared/types/search";
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

      <FiltersPanel filters={filters} sourceTypes={sourceTypes} onChange={setFilters} />

      <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] gap-6">
        <ParsedQueryCard parsedQuery={selectedResult.parsedQuery} />
        <AnswerSummaryCard answer={selectedResult.answer} />
      </div>

      <EvidenceTable claims={filteredClaims} />

      <div className="grid grid-cols-[minmax(0,1fr)_460px] gap-6">
        <div className="space-y-6">
          <KnowledgeGraph
            graph={selectedResult.graph}
            contradictions={selectedResult.contradictions}
            gaps={selectedResult.gaps}
            mode="compact"
          />
          <SourcesPanel sources={filteredSources} claims={filteredClaims} />
        </div>
        <div className="space-y-6">
          <ContradictionsPanel contradictions={selectedResult.contradictions} />
          <GapsPanel gaps={selectedResult.gaps} />
          <ExportPanel />
        </div>
      </div>
    </div>
  );
}
