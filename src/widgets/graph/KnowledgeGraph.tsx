import { useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  Panel,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Contradiction } from "../../entities/contradiction/types";
import type { KnowledgeGap } from "../../entities/gap/types";
import type {
  GraphEdge,
  GraphNode,
  KnowledgeGraph as KnowledgeGraphModel,
} from "../../entities/graph/types";
import type { ConfidenceLevel } from "../../entities/source/types";
import { SectionCard } from "../../shared/ui/SectionCard";
import { GraphLegend } from "./GraphLegend";
import { GraphNodeDetails, type GraphNodeDetailsData } from "./GraphNodeDetails";

type KnowledgeGraphMode = "compact" | "full";

type KnowledgeGraphProps = {
  graph: KnowledgeGraphModel;
  mode?: KnowledgeGraphMode;
  title?: string;
  contradictions?: Contradiction[];
  gaps?: KnowledgeGap[];
};

type VisualNodeType =
  | GraphNode["type"]
  | "condition"
  | "contradiction"
  | "gap";

type FlowNodeData = {
  label: string;
  visualType: VisualNodeType;
  confidence?: ConfidenceLevel;
  description?: string;
  relatedIds?: string[];
  metadata?: Record<string, string | number | boolean>;
};

type FlowNode = Node<FlowNodeData>;
type FlowEdge = Edge<{ relation: string }>;

const nodeColorByType: Record<
  VisualNodeType,
  { background: string; border: string; color: string; glow: string }
> = {
  claim: {
    background: "rgba(8, 47, 73, 0.9)",
    border: "rgba(125, 211, 252, 0.78)",
    color: "#dff6ff",
    glow: "rgba(14, 165, 233, 0.34)",
  },
  material: {
    background: "rgba(30, 41, 59, 0.92)",
    border: "rgba(148, 163, 184, 0.72)",
    color: "#e2e8f0",
    glow: "rgba(148, 163, 184, 0.2)",
  },
  process: {
    background: "rgba(21, 94, 117, 0.84)",
    border: "rgba(103, 232, 249, 0.74)",
    color: "#ecfeff",
    glow: "rgba(34, 211, 238, 0.28)",
  },
  technology: {
    background: "rgba(30, 64, 175, 0.78)",
    border: "rgba(147, 197, 253, 0.72)",
    color: "#eff6ff",
    glow: "rgba(96, 165, 250, 0.28)",
  },
  equipment: {
    background: "rgba(67, 56, 202, 0.76)",
    border: "rgba(165, 180, 252, 0.74)",
    color: "#eef2ff",
    glow: "rgba(129, 140, 248, 0.28)",
  },
  parameter: {
    background: "rgba(120, 53, 15, 0.84)",
    border: "rgba(251, 191, 36, 0.74)",
    color: "#fef3c7",
    glow: "rgba(245, 158, 11, 0.28)",
  },
  condition: {
    background: "rgba(120, 53, 15, 0.84)",
    border: "rgba(251, 191, 36, 0.74)",
    color: "#fef3c7",
    glow: "rgba(245, 158, 11, 0.28)",
  },
  effect: {
    background: "rgba(6, 95, 70, 0.82)",
    border: "rgba(110, 231, 183, 0.74)",
    color: "#ecfdf5",
    glow: "rgba(16, 185, 129, 0.28)",
  },
  source: {
    background: "rgba(91, 33, 182, 0.78)",
    border: "rgba(196, 181, 253, 0.74)",
    color: "#f5f3ff",
    glow: "rgba(167, 139, 250, 0.26)",
  },
  contradiction: {
    background: "rgba(127, 29, 29, 0.88)",
    border: "rgba(248, 113, 113, 0.9)",
    color: "#fee2e2",
    glow: "rgba(239, 68, 68, 0.42)",
  },
  gap: {
    background: "rgba(124, 45, 18, 0.88)",
    border: "rgba(251, 146, 60, 0.88)",
    color: "#ffedd5",
    glow: "rgba(249, 115, 22, 0.36)",
  },
};

const relationColor: Record<string, string> = {
  supports: "#38bdf8",
  mentions: "#94a3b8",
  has_condition: "#f59e0b",
  has_effect: "#34d399",
  derived_from: "#a78bfa",
  contradicts: "#fb7185",
  has_gap: "#fb923c",
  uses_equipment: "#818cf8",
  applies_to_process: "#2dd4bf",
  influences: "#2dd4bf",
  requires: "#818cf8",
  measured_in: "#f59e0b",
  contains: "#94a3b8",
  selected_for: "#38bdf8",
};

const relationLabel: Record<string, string> = {
  supports: "подтверждает",
  mentions: "связано",
  has_condition: "условие",
  has_effect: "эффект",
  derived_from: "источник",
  contradicts: "конфликт",
  has_gap: "пробел",
  uses_equipment: "оборудование",
  applies_to_process: "процесс",
  influences: "влияет",
  requires: "требует",
  measured_in: "измеряется",
  contains: "содержит",
  selected_for: "выбрано",
};

function getNodePosition(index: number, mode: KnowledgeGraphMode): { x: number; y: number } {
  const columns = mode === "compact" ? 3 : 4;
  const columnGap = mode === "compact" ? 250 : 330;
  const rowGap = mode === "compact" ? 160 : 205;

  return {
    x: (index % columns) * columnGap,
    y: Math.floor(index / columns) * rowGap,
  };
}

function toDetailsData(node: FlowNode): GraphNodeDetailsData {
  return {
    id: node.id,
    label: node.data.label,
    type: node.data.visualType,
    confidence: node.data.confidence,
    description: node.data.description,
    relatedIds: node.data.relatedIds,
    metadata: node.data.metadata,
  };
}

function createFlowNode(node: GraphNode, index: number, mode: KnowledgeGraphMode): FlowNode {
  const color = nodeColorByType[node.type];

  return {
    id: node.id,
    position: getNodePosition(index, mode),
    data: {
      label: node.label,
      visualType: node.type,
      confidence: node.confidence,
      metadata: node.metadata,
    },
    style: {
      width: mode === "compact" ? 180 : 220,
      minHeight: mode === "compact" ? 48 : 54,
      padding: mode === "compact" ? "10px 14px" : "12px 16px",
      borderRadius: 18,
      border: `1px solid ${color.border}`,
      background: color.background,
      color: color.color,
      fontSize: mode === "compact" ? 11 : 12,
      fontWeight: 700,
      lineHeight: 1.35,
      whiteSpace: "normal",
      textAlign: "center",
      overflowWrap: "break-word",
      boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 24px ${color.glow}, 0 18px 36px rgba(0,0,0,0.34)`,
    },
  };
}

function createIssueNode(
  issue: Contradiction | KnowledgeGap,
  index: number,
  mode: KnowledgeGraphMode,
  visualType: "contradiction" | "gap",
): FlowNode {
  const color = nodeColorByType[visualType];
  const isContradiction = visualType === "contradiction";
  const relatedIds = isContradiction
    ? (issue as Contradiction).claimIds
    : (issue as KnowledgeGap).relatedSourceRefs.map((sourceRef) => sourceRef.sourceId);

  return {
    id: issue.id,
    position: getNodePosition(index, mode),
    data: {
      label: issue.title,
      visualType,
      confidence: issue.confidence,
      description: issue.description,
      relatedIds,
      metadata: {
        severity: issue.severity,
      },
    },
    style: {
      width: mode === "compact" ? 190 : 230,
      minHeight: mode === "compact" ? 54 : 64,
      padding: mode === "compact" ? "10px 14px" : "12px 16px",
      borderRadius: 18,
      border: `2px solid ${color.border}`,
      background: color.background,
      color: color.color,
      fontSize: mode === "compact" ? 11 : 12,
      fontWeight: 800,
      lineHeight: 1.35,
      whiteSpace: "normal",
      textAlign: "center",
      overflowWrap: "break-word",
      boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 28px ${color.glow}, 0 18px 36px rgba(0,0,0,0.36)`,
    },
  };
}

function getEdgeLabel(relation: string, fallbackLabel?: string): string {
  const label = relationLabel[relation] ?? fallbackLabel ?? relation;
  return label.length > 18 ? `${label.slice(0, 17)}…` : label;
}

function createFlowEdge(edge: GraphEdge): FlowEdge {
  const color = relationColor[edge.relation] ?? "#64748b";

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: getEdgeLabel(edge.relation, edge.label),
    data: { relation: edge.relation },
    type: "smoothstep",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color,
      width: 16,
      height: 16,
    },
    style: {
      stroke: color,
      strokeWidth: edge.relation === "contradicts" ? 1.7 : 1.25,
      opacity: 0.72,
    },
    labelStyle: {
      fill: "#cbd5e1",
      fontSize: 10,
      fontWeight: 600,
    },
    labelBgStyle: {
      fill: "#0f172a",
      fillOpacity: 0.78,
    },
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 10,
  };
}

function createIssueEdges(issues: Array<Contradiction | KnowledgeGap>, visualType: "contradiction" | "gap"): FlowEdge[] {
  return issues.flatMap((issue) => {
    const color = visualType === "contradiction" ? "#dc2626" : "#ea580c";
    const targets =
      visualType === "contradiction"
        ? (issue as Contradiction).claimIds
        : (issue as KnowledgeGap).relatedSourceRefs.map((sourceRef) => sourceRef.sourceId);

    return targets.map((targetId) => ({
      id: `${issue.id}-${targetId}`,
      source: issue.id,
      target: targetId,
      label: getEdgeLabel(visualType === "contradiction" ? "contradicts" : "has_gap"),
      data: { relation: visualType === "contradiction" ? "contradicts" : "has_gap" },
      type: "smoothstep",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 16,
        height: 16,
      },
      style: {
        stroke: color,
        strokeWidth: 1.65,
        opacity: 0.78,
        strokeDasharray: visualType === "gap" ? "6 4" : undefined,
      },
      labelStyle: {
        fill: "#e2e8f0",
        fontSize: 10,
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: "#0f172a",
        fillOpacity: 0.82,
      },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 10,
    }));
  });
}

function GraphControls() {
  const { fitView, zoomIn, zoomOut } = useReactFlow<FlowNode, FlowEdge>();

  const buttonClassName =
    "h-9 min-w-9 rounded border border-white/10 bg-slate-950/82 px-3 text-sm font-semibold text-slate-100 shadow-lg shadow-cyan-950/25 backdrop-blur transition hover:border-ice-300/60 hover:bg-ice-500/18 hover:text-white";

  return (
    <Panel position="top-right" className="m-3">
      <div className="flex items-center gap-2 rounded border border-white/10 bg-slate-950/52 p-1.5 shadow-glass backdrop-blur">
        <button type="button" className={buttonClassName} onClick={() => zoomIn()}>
          +
        </button>
        <button type="button" className={buttonClassName} onClick={() => zoomOut()}>
          −
        </button>
        <button
          type="button"
          className={buttonClassName}
          onClick={() => fitView({ padding: 0.22, duration: 420 })}
        >
          Вписать
        </button>
      </div>
    </Panel>
  );
}

export function KnowledgeGraph({
  graph,
  mode = "compact",
  title = "Граф связей",
  contradictions = [],
  gaps = [],
}: KnowledgeGraphProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNodeDetailsData | null>(null);

  const { nodes, edges } = useMemo(() => {
    const visibleGraphNodes = mode === "compact" ? graph.nodes.slice(0, 10) : graph.nodes;
    const baseNodes = visibleGraphNodes.map((node, index) => createFlowNode(node, index, mode));
    const issueStartIndex = baseNodes.length;
    const issueNodes = [
      ...contradictions.map((contradiction, index) =>
        createIssueNode(contradiction, issueStartIndex + index, mode, "contradiction"),
      ),
      ...gaps.map((gap, index) =>
        createIssueNode(gap, issueStartIndex + contradictions.length + index, mode, "gap"),
      ),
    ];
    const nodeIds = new Set([...baseNodes, ...issueNodes].map((node) => node.id));
    const baseEdges = graph.edges
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map(createFlowEdge);
    const issueEdges = createIssueEdges(contradictions, "contradiction").filter((edge) =>
      nodeIds.has(edge.target),
    );
    const gapEdges = createIssueEdges(gaps, "gap").filter((edge) => nodeIds.has(edge.target));

    return {
      nodes: [...baseNodes, ...issueNodes],
      edges: [...baseEdges, ...issueEdges, ...gapEdges],
    };
  }, [contradictions, gaps, graph.edges, graph.nodes, mode]);

  const handleNodeClick: NodeMouseHandler<FlowNode> = (_event, node) => {
    setSelectedNode(toDetailsData(node));
  };

  const heightClassName = mode === "compact" ? "h-[360px]" : "h-[660px]";
  const showSidePanel = mode === "full";

  return (
    <SectionCard
      title={title}
      eyebrow={mode === "compact" ? "Предпросмотр графа знаний" : "Граф знаний"}
      className={mode === "full" ? "bg-white/78" : ""}
    >
      {nodes.length === 0 ? (
        <div className="rounded border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Для выбранного сценария граф пока пуст.
        </div>
      ) : (
        <div className={showSidePanel ? "grid grid-cols-[minmax(0,1fr)_320px] gap-4" : "space-y-4"}>
          <div
            className={`overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950 shadow-[0_0_0_1px_rgba(125,211,252,0.08),0_28px_70px_rgba(2,6,23,0.38)] ${heightClassName}`}
          >
            <ReactFlow<FlowNode, FlowEdge>
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
              fitView
              fitViewOptions={{ padding: mode === "compact" ? 0.26 : 0.22 }}
              minZoom={0.22}
              maxZoom={1.75}
              defaultEdgeOptions={{ type: "smoothstep" }}
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                color="rgba(148, 163, 184, 0.24)"
                gap={28}
                size={1.35}
              />
              <GraphControls />
            </ReactFlow>
          </div>

          {showSidePanel ? (
            <div className="space-y-4">
              <GraphLegend />
              <GraphNodeDetails node={selectedNode} />
            </div>
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-4">
              <GraphLegend />
              <GraphNodeDetails node={selectedNode} />
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
