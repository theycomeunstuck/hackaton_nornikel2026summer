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
import type {
  GraphEdge as KnowledgeGraphEdge,
  GraphNode as KnowledgeGraphNode,
  KnowledgeGraph as KnowledgeGraphModel,
} from "../../shared/types/search";
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

type NodeVisualStyle = {
  border: string;
  background: string;
  color: string;
  shadow: string;
};

type EdgeVisualStyle = {
  color: string;
  width: number;
  opacity: number;
};

const nodeTypeLabel: Record<string, string> = {
  material: "материал",
  process: "процесс",
  equipment: "оборудование",
  parameter: "параметр",
  condition: "условие",
  claim: "фрагмент",
  source: "источник",
  effect: "эффект",
  technology: "технология",
};

const nodeStyleByType: Record<string, NodeVisualStyle> = {
  material: {
    border: "rgba(148, 163, 184, 0.72)",
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    color: "#0f172a",
    shadow: "0 16px 34px rgba(148, 163, 184, 0.2)",
  },
  process: {
    border: "rgba(34, 211, 238, 0.72)",
    background: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)",
    color: "#155e75",
    shadow: "0 16px 34px rgba(34, 211, 238, 0.22)",
  },
  parameter: {
    border: "rgba(245, 158, 11, 0.74)",
    background: "linear-gradient(135deg, #fffbeb 0%, #fde68a 100%)",
    color: "#92400e",
    shadow: "0 16px 34px rgba(245, 158, 11, 0.2)",
  },
  condition: {
    border: "rgba(249, 115, 22, 0.74)",
    background: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
    color: "#9a3412",
    shadow: "0 16px 34px rgba(249, 115, 22, 0.22)",
  },
  equipment: {
    border: "rgba(129, 140, 248, 0.74)",
    background: "linear-gradient(135deg, #eef2ff 0%, #c7d2fe 100%)",
    color: "#3730a3",
    shadow: "0 16px 34px rgba(129, 140, 248, 0.22)",
  },
  source: {
    border: "rgba(167, 139, 250, 0.74)",
    background: "linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)",
    color: "#5b21b6",
    shadow: "0 16px 34px rgba(167, 139, 250, 0.22)",
  },
  effect: {
    border: "rgba(52, 211, 153, 0.74)",
    background: "linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)",
    color: "#065f46",
    shadow: "0 16px 34px rgba(52, 211, 153, 0.22)",
  },
  technology: {
    border: "rgba(96, 165, 250, 0.74)",
    background: "linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)",
    color: "#1d4ed8",
    shadow: "0 16px 34px rgba(96, 165, 250, 0.22)",
  },
  other: {
    border: "rgba(125, 211, 252, 0.6)",
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    color: "#075985",
    shadow: "0 16px 34px rgba(14, 165, 233, 0.18)",
  },
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
  return nodeTypeLabel[type] ?? "другое";
}

function getNodeVisualStyle(node: KnowledgeGraphNode): NodeVisualStyle {
  return nodeStyleByType[node.type] ?? nodeStyleByType.other;
}

function getNormalizedRelation(relation: string): string {
  return relation.trim().toLowerCase();
}

function getEdgeVisualStyle(edge: KnowledgeGraphEdge): EdgeVisualStyle {
  const relation = getNormalizedRelation(edge.relation);

  if (relation === "supports" || relation === "support") {
    return { color: "#22c55e", width: edge.confidence === "high" ? 2.9 : 2.45, opacity: 0.9 };
  }

  if (relation === "contains" || relation === "has_parameter" || relation === "measured_in") {
    return { color: "#38bdf8", width: edge.confidence === "high" ? 2.55 : 2.1, opacity: 0.82 };
  }

  if (
    relation === "influences" ||
    relation === "increases" ||
    relation === "improves" ||
    relation === "reduces"
  ) {
    return { color: "#f97316", width: edge.confidence === "high" ? 2.65 : 2.15, opacity: 0.86 };
  }

  if (relation === "contradicts" || relation === "conflicts") {
    return { color: "#f43f5e", width: 2.85, opacity: 0.92 };
  }

  if (relation === "uses" || relation === "selected_for") {
    return { color: "#14b8a6", width: edge.confidence === "high" ? 2.55 : 2.1, opacity: 0.84 };
  }

  if (edge.confidence === "high") {
    return { color: "#67e8f9", width: 2.35, opacity: 0.78 };
  }

  return { color: "#94a3b8", width: 1.35, opacity: 0.58 };
}

function createFlowNodes(graph: KnowledgeGraphModel, mode: KnowledgeGraphMode): FlowNode[] {
  return graph.nodes.map((node, index) => {
    const nodeVisualStyle = getNodeVisualStyle(node);

    return {
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
        borderRadius: 16,
        border: `1px solid ${nodeVisualStyle.border}`,
        background: nodeVisualStyle.background,
        color: nodeVisualStyle.color,
        boxShadow: nodeVisualStyle.shadow,
        fontSize: mode === "compact" ? 12 : 13,
        fontWeight: 700,
        lineHeight: 1.3,
        whiteSpace: "pre-line",
        textAlign: "center",
        overflowWrap: "break-word",
        wordBreak: "normal",
        padding: "12px 14px",
      },
    };
  });
}

function createFlowEdges(graph: KnowledgeGraphModel): FlowEdge[] {
  return graph.edges.map((edge) => {
    const edgeVisualStyle = getEdgeVisualStyle(edge);

    return {
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
        color: edgeVisualStyle.color,
        width: 16,
        height: 16,
      },
      style: {
        stroke: edgeVisualStyle.color,
        strokeWidth: edgeVisualStyle.width,
        opacity: edgeVisualStyle.opacity,
      },
      labelStyle: {
        fill: "#0f172a",
        fontSize: 11,
        fontWeight: 700,
      },
      labelBgStyle: {
        fill: "#f8fafc",
        fillOpacity: 0.96,
      },
      labelBgPadding: [7, 4],
      labelBgBorderRadius: 7,
    };
  });
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
