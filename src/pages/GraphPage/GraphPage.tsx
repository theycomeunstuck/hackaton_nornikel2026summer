import { useMemo, useState } from "react";
import { demoScenarios } from "../../shared/mock/demoScenarios.mock";
import { mockSearchResults } from "../../shared/mock/searchResults.mock";
import type { DemoScenario, SearchResult } from "../../shared/types/search";
import { KnowledgeGraph } from "../../widgets/graph/KnowledgeGraph";
import { DemoScenarioButtons } from "../../widgets/search/DemoScenarioButtons";

const initialResult = mockSearchResults[0];

function getResultByScenario(scenario: DemoScenario): SearchResult {
  return (
    mockSearchResults.find((result) => result.id === scenario.searchResultId) ?? initialResult
  );
}

export function GraphPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult>(initialResult);

  const graphStats = useMemo(
    () => ({
      nodes:
        selectedResult.graph.nodes.length +
        selectedResult.contradictions.length +
        selectedResult.gaps.length,
      edges:
        selectedResult.graph.edges.length +
        selectedResult.contradictions.reduce(
          (sum, contradiction) => sum + contradiction.claimIds.length,
          0,
        ) +
        selectedResult.gaps.reduce(
          (sum, gap) => sum + gap.relatedSourceRefs.length,
          0,
        ),
      sources: selectedResult.sources.length,
      claims: selectedResult.evidence.length,
    }),
    [selectedResult],
  );

  const handleScenarioSelect = (scenario: DemoScenario) => {
    setSelectedResult(getResultByScenario(scenario));
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-6">
      <section className="rounded border border-white/75 bg-white/72 p-6 shadow-glass backdrop-blur-2xl">
        <div className="grid grid-cols-[minmax(0,1fr)_520px] gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ice-600">
              Граф знаний
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">
              Граф доказательных связей
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
              Граф показывает, как утверждения связаны с материалами, процессами,
              технологиями, условиями, эффектами и источниками. Узлы противоречий
              и пробелов выделены отдельно, чтобы эксперт сразу видел слабые зоны
              доказательной базы.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded border border-ice-100 bg-ice-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ice-600">
                Узлы
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{graphStats.nodes}</p>
            </div>
            <div className="rounded border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Связи
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{graphStats.edges}</p>
            </div>
            <div className="rounded border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                Утверждения
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{graphStats.claims}</p>
            </div>
            <div className="rounded border border-violet-100 bg-violet-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                Источники
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{graphStats.sources}</p>
            </div>
          </div>
        </div>
      </section>

      <DemoScenarioButtons
        scenarios={demoScenarios}
        selectedScenarioId={selectedResult.scenarioId}
        onSelect={handleScenarioSelect}
      />

      <KnowledgeGraph
        graph={selectedResult.graph}
        contradictions={selectedResult.contradictions}
        gaps={selectedResult.gaps}
        mode="full"
        title={selectedResult.title}
      />
    </div>
  );
}
