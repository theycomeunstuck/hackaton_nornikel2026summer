import { useEffect, useMemo, useState } from "react";
import { demoScenarios } from "../../shared/mock/demoScenarios.mock";
import { mockSearchResults } from "../../shared/mock/searchResults.mock";
import { getGraph } from "../../shared/api/appApi";
import { adaptRagKnowledgeGraph } from "../../shared/api/ragResultAdapter";
import type { DemoScenario, KnowledgeGraph as UiKnowledgeGraph, SearchResult } from "../../shared/types/search";
import { ContentContainer } from "../../shared/ui/ContentContainer";
import { EvidencePageHeader } from "../../shared/ui/EvidencePageHeader";
import { MetricCard } from "../../shared/ui/MetricCard";
import { KnowledgeGraph } from "../../widgets/graph/KnowledgeGraph";
import { DemoScenarioButtons } from "../../widgets/search/DemoScenarioButtons";

const initialResult = mockSearchResults[0];

function getResultByScenario(scenario: DemoScenario): SearchResult {
  return (
    mockSearchResults.find((result) => result.id === scenario.searchResultId) ?? initialResult
  );
}

function GraphHeaderAside({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-ice-100 bg-ice-50/75 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ice-600">
        Активный граф
      </p>
      <h2 className="mt-3 text-xl font-semibold leading-7 text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Узлы показывают материалы, процессы, параметры, источники и проверяемые утверждения.
        Цветные связи помогают быстро отличить подтверждение, влияние, конфликт и техническую
        зависимость.
      </p>
    </div>
  );
}

export function GraphPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult>(initialResult);
  const [backendGraph, setBackendGraph] = useState<UiKnowledgeGraph | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState(true);
  const [graphError, setGraphError] = useState<string | null>(null);

  const selectedScenario =
    demoScenarios.find((scenario) => scenario.searchResultId === selectedResult.id) ??
    demoScenarios[0];
  const activeGraph = backendGraph ?? selectedResult.graph;

  const graphStats = useMemo(
    () => ({
      nodes: activeGraph.nodes.length + selectedResult.contradictions.length + selectedResult.gaps.length,
      edges:
        activeGraph.edges.length +
        selectedResult.contradictions.reduce(
          (sum, contradiction) => sum + contradiction.claimIds.length,
          0,
        ) +
        selectedResult.gaps.reduce((sum, gap) => sum + gap.relatedSourceRefs.length, 0),
      sources: selectedResult.sources.length,
      claims: selectedResult.evidence.length,
    }),
    [activeGraph, selectedResult],
  );

  const loadGraph = (topic?: string) => {
    setIsGraphLoading(true);
    setGraphError(null);

    getGraph(topic)
      .then((graph) => {
        setBackendGraph(adaptRagKnowledgeGraph(graph));
      })
      .catch(() => {
        setBackendGraph(null);
        setGraphError("Backend-граф недоступен, показан локальный граф.");
      })
      .finally(() => {
        setIsGraphLoading(false);
      });
  };

  useEffect(() => {
    loadGraph();
  }, []);

  const handleScenarioSelect = (scenario: DemoScenario) => {
    const nextResult = getResultByScenario(scenario);
    setSelectedResult(nextResult);
    loadGraph(scenario.defaultQuery || scenario.title);
  };

  return (
    <ContentContainer>
      <EvidencePageHeader
        eyebrow="Граф знаний"
        title="Граф доказательных связей"
        description="Страница показывает, как утверждения связаны с материалами, процессами, технологиями, условиями, эффектами и источниками. Отдельные типы связей подсвечены цветом, чтобы специалист быстрее видел подтверждения, влияния, конфликты и слабые зоны доказательной базы."
        aside={<GraphHeaderAside title={selectedScenario.title} />}
      />

      <section className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Узлы"
          value={String(graphStats.nodes)}
          description="Объекты графа: материалы, процессы, параметры, источники и выводы."
          tone="cyan"
        />
        <MetricCard
          label="Связи"
          value={String(graphStats.edges)}
          description="Отношения между узлами, включая подтверждения и конфликты."
          tone="green"
        />
        <MetricCard
          label="Утверждения"
          value={String(graphStats.claims)}
          description="Проверяемые фрагменты доказательной базы в выбранном направлении."
          tone="amber"
        />
        <MetricCard
          label="Источники"
          value={String(graphStats.sources)}
          description="Документы и публикации, связанные с текущим графом."
          tone="violet"
        />
      </section>

      <DemoScenarioButtons
        scenarios={demoScenarios}
        selectedScenarioId={selectedScenario.id}
        onSelect={handleScenarioSelect}
      />

      <div className="rounded-xl border border-ice-100 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm">
        {isGraphLoading ? (
          <span className="text-ice-700">Загрузка графа из /api/graph...</span>
        ) : graphError ? (
          <span className="text-amber-700">{graphError}</span>
        ) : activeGraph.nodes.length === 0 ? (
          <span className="text-amber-700">Граф пока пуст.</span>
        ) : (
          <span className="text-emerald-700">Граф обновлён из /api/graph.</span>
        )}
      </div>

      <KnowledgeGraph
        graph={activeGraph}
        contradictions={selectedResult.contradictions}
        gaps={selectedResult.gaps}
        mode="full"
        title={`Граф: ${selectedScenario.title}`}
      />
    </ContentContainer>
  );
}
