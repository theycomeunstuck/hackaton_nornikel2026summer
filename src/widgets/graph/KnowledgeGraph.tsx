import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
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

const nodeColorByType: Record<VisualNodeType, { background: string; border: string; color: string }> = {
  claim: { background: "#e6f6ff", border: "#8ddcff", color: "#075985" },
  material: { background: "#ffffff", border: "#cbd5e1", color: "#334155" },
  process: { background: "#ecfeff", border: "#67e8f9", color: "#0e7490" },
  technology: { background: "#eff6ff", border: "#93c5fd", color: "#1d4ed8" },
  equipment: { background: "#eef2ff", border: "#a5b4fc", color: "#4338ca" },
  parameter: { background: "#fffbeb", border: "#fcd34d", color: "#92400e" },
  condition: { background: "#fffbeb", border: "#f59e0b", color: "#92400e" },
  effect: { background: "#ecfdf5", border: "#6ee7b7", color: "#047857" },
  source: { background: "#f5f3ff", border: "#c4b5fd", color: "#6d28d9" },
  contradiction: { background: "#fef2f2", border: "#f87171", color: "#b91c1c" },
  gap: { background: "#fff7ed", border: "#fb923c", color: "#c2410c" },
};

const relationColor: Record<string, string> = {
  supports: "#0891b2",
  mentions: "#64748b",
  has_condition: "#d97706",
  has_effect: "#059669",
  derived_from: "#7c3aed",
  contradicts: "#dc2626",
  has_gap: "#ea580c",
  uses_equipment: "#4f46e5",
  applies_to_process: "#0f766e",
  influences: "#0f766e",
  requires: "#4f46e5",
  measured_in: "#d97706",
  contains: "#64748b",
  selected_for: "#0284c7",
};

function getNodePosition(index: number, mode: KnowledgeGraphMode): { x: number; y: number } {
  const columns = mode === "compact" ? 4 : 5;
  const columnGap = mode === "compact" ? 170 : 220;
  const rowGap = mode === "compact" ? 110 : 135;

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
      width: mode === "compact" ? 150 : 180,
      minHeight: mode === "compact" ? 52 : 62,
      padding: 10,
      borderRadius: 8,
      border: `1px solid ${color.border}`,
      background: color.background,
      color: color.color,
      fontSize: mode === "compact" ? 11 : 12,
      fontWeight: 700,
      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.10)",
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
      width: mode === "compact" ? 160 : 190,
      minHeight: mode === "compact" ? 58 : 70,
      padding: 10,
      borderRadius: 8,
      border: `2px solid ${color.border}`,
      background: color.background,
      color: color.color,
      fontSize: mode === "compact" ? 11 : 12,
      fontWeight: 800,
      boxShadow: `0 0 0 3px ${visualType === "contradiction" ? "rgba(248,113,113,0.18)" : "rgba(251,146,60,0.18)"}`,
    },
  };
}

function createFlowEdge(edge: GraphEdge): FlowEdge {
  const color = relationColor[edge.relation] ?? "#64748b";

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    data: { relation: edge.relation },
    type: "smoothstep",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color,
    },
    style: {
      stroke: color,
      strokeWidth: edge.relation === "contradicts" ? 2.4 : 1.8,
    },
    labelStyle: {
      fill: "#334155",
      fontSize: 11,
      fontWeight: 700,
    },
    labelBgStyle: {
      fill: "#ffffff",
      fillOpacity: 0.88,
    },
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
      label: visualType === "contradiction" ? "contradicts" : "has_gap",
      data: { relation: visualType === "contradiction" ? "contradicts" : "has_gap" },
      type: "smoothstep",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
      },
      style: {
        stroke: color,
        strokeWidth: 2.2,
        strokeDasharray: visualType === "gap" ? "6 4" : undefined,
      },
      labelStyle: {
        fill: "#334155",
        fontSize: 11,
        fontWeight: 700,
      },
      labelBgStyle: {
        fill: "#ffffff",
        fillOpacity: 0.9,
      },
    }));
  });
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
          <div className={`overflow-hidden rounded border border-slate-200 bg-slate-950 ${heightClassName}`}>
            <ReactFlow<FlowNode, FlowEdge>
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.35}
              maxZoom={1.6}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#334155" gap={24} />
              <Controls showInteractive={false} />
              {mode === "full" ? <MiniMap pannable zoomable nodeStrokeWidth={3} /> : null}
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
