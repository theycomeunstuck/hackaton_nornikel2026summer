import type { KnowledgeGraph as KnowledgeGraphModel } from "../../entities/graph/types";
import { SectionCard } from "../../shared/ui/SectionCard";

type KnowledgeGraphProps = {
  graph: KnowledgeGraphModel;
};

export function KnowledgeGraph({ graph }: KnowledgeGraphProps) {
  const featuredNodes = graph.nodes.slice(0, 8);
  const featuredEdges = graph.edges.slice(0, 6);

  return (
    <SectionCard title="Граф связей" eyebrow="Knowledge graph preview">
      <div className="rounded border border-slate-200 bg-slate-950 p-4 text-white">
        <div className="flex flex-wrap gap-2">
          {featuredNodes.map((node) => (
            <span
              key={node.id}
              className="rounded border border-ice-300/25 bg-white/8 px-3 py-2 text-xs font-medium text-ice-100"
            >
              {node.label}
            </span>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {featuredEdges.map((edge) => (
            <div key={edge.id} className="grid grid-cols-[1fr_120px_1fr] items-center gap-3 text-xs text-slate-300">
              <span className="truncate">{edge.source}</span>
              <span className="rounded border border-white/10 bg-ice-500/15 px-2 py-1 text-center text-ice-100">
                {edge.label}
              </span>
              <span className="truncate text-right">{edge.target}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
