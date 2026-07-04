import { useMemo, useState } from "react";
import { demoScenarios } from "../../shared/mock/demoScenarios.mock";
import { mockSearchResults } from "../../shared/mock/searchResults.mock";
import type { DemoScenario, SearchResult } from "../../shared/types/search";
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

  const selectedScenario =
    demoScenarios.find((scenario) => scenario.searchResultId === selectedResult.id) ??
    demoScenarios[0];

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
        selectedResult.gaps.reduce((sum, gap) => sum + gap.relatedSourceRefs.length, 0),
      sources: selectedResult.sources.length,
      claims: selectedResult.evidence.length,
    }),
    [selectedResult],
  );

  const handleScenarioSelect = (scenario: DemoScenario) => {
    setSelectedResult(getResultByScenario(scenario));
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

      <KnowledgeGraph
        graph={selectedResult.graph}
        contradictions={selectedResult.contradictions}
        gaps={selectedResult.gaps}
        mode="full"
        title={`Граф: ${selectedScenario.title}`}
      />
    </ContentContainer>
  );
}
