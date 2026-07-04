import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { KnowledgeGraph as KnowledgeGraphModel } from "../../shared/types/search";
import { SectionCard } from "../../shared/ui/SectionCard";
import { GraphLegend } from "./GraphLegend";

type KnowledgeGraphMode = "compact" | "full";

type KnowledgeGraphProps = {
  graph: KnowledgeGraphModel;
  mode?: KnowledgeGraphMode;
  title?: string;
  contradictions?: readonly unknown[];
  gaps?: readonly unknown[];
};

type FlowNodeData = {
  label: string;
};

type FlowNode = Node<FlowNodeData>;
type FlowEdge = Edge<{ relation: string }>;

const nodeTypeLabel: Record<string, string> = {
  material: "материал",
  process: "процесс",
  equipment: "оборудование",
  parameter: "параметр",
  claim: "фрагмент",
  source: "источник",
  effect: "эффект",
  technology: "технология",
};

function getNodePosition(index: number, mode: KnowledgeGraphMode): { x: number; y: number } {
  const columns = mode === "compact" ? 3 : 4;
  const columnGap = mode === "compact" ? 260 : 310;
  const rowGap = mode === "compact" ? 150 : 180;

  return {
    x: (index % columns) * columnGap,
    y: Math.floor(index / columns) * rowGap,
  };
}

function getNodeTypeLabel(type: string): string {
  return nodeTypeLabel[type] ?? type;
}

function createFlowNodes(graph: KnowledgeGraphModel, mode: KnowledgeGraphMode): FlowNode[] {
  return graph.nodes.map((node, index) => ({
    id: node.id,
    position: getNodePosition(index, mode),
    data: {
      label: `${node.label}\n${getNodeTypeLabel(node.type)}`,
    },
    style: {
      width: mode === "compact" ? 190 : 220,
      height: mode === "compact" ? 76 : 86,
      minHeight: mode === "compact" ? 64 : 72,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      border: "1px solid rgba(14, 165, 233, 0.36)",
      background: "#ffffff",
      color: "#0f172a",
      boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)",
      fontSize: mode === "compact" ? 12 : 13,
      fontWeight: 700,
      lineHeight: 1.3,
      whiteSpace: "pre-line",
      textAlign: "center",
      overflowWrap: "break-word",
      wordBreak: "normal",
      padding: "12px 14px",
    },
  }));
}

function createFlowEdges(graph: KnowledgeGraphModel): FlowEdge[] {
  return graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.relation,
    data: {
      relation: edge.relation,
    },
    type: "smoothstep",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#0284c7",
      width: 16,
      height: 16,
    },
    style: {
      stroke: "#0284c7",
      strokeWidth: 1.6,
    },
    labelStyle: {
      fill: "#0f172a",
      fontSize: 11,
      fontWeight: 700,
    },
    labelBgStyle: {
      fill: "#e0f2fe",
      fillOpacity: 0.95,
    },
    labelBgPadding: [6, 4],
    labelBgBorderRadius: 6,
  }));
}

export function KnowledgeGraph({ graph, mode = "compact", title = "Граф связей" }: KnowledgeGraphProps) {
  const nodes = useMemo(() => createFlowNodes(graph, mode), [graph, mode]);
  const edges = useMemo(() => createFlowEdges(graph), [graph]);
  const heightClassName = mode === "compact" ? "h-[360px]" : "h-[640px]";

  return (
    <SectionCard title={title} eyebrow="Связи результата">
      {nodes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
          <p className="text-sm font-semibold text-slate-700">Граф пока пуст</p>
          <p className="mt-2 text-sm text-slate-500">
            Для выбранного результата нет узлов, которые можно показать.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={`${heightClassName} overflow-hidden rounded-xl border border-slate-200 bg-slate-950`}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={22}
                size={1}
                color="rgba(148, 163, 184, 0.34)"
              />
            </ReactFlow>
          </div>
          <GraphLegend />
        </div>
      )}
    </SectionCard>
  );
}
