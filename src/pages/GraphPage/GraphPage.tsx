import { PagePlaceholder } from "../../shared/ui/PagePlaceholder";

export function GraphPage() {
  return (
    <PagePlaceholder
      eyebrow="Knowledge graph"
      title="Связи материалов, процессов и источников"
      description="Раздел для визуализации отношений между материалами, технологиями, оборудованием, параметрами, утверждениями и source references."
      metrics={[
        { label: "Nodes", value: "72", tone: "cyan" },
        { label: "Edges", value: "144", tone: "green" },
        { label: "Materials", value: "18", tone: "cyan" },
        { label: "Processes", value: "11", tone: "amber" },
      ]}
    >
      <h3 className="text-xl font-semibold text-slate-950">Placeholder графа</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Глубокая реализация React Flow не входит в эту итерацию. Сейчас экран фиксирует
        маршрут и место под будущий knowledge graph.
      </p>
    </PagePlaceholder>
  );
}
