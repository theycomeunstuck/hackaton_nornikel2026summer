import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
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
  originalNode: KnowledgeGraphNode;
};

type FlowNode = Node<FlowNodeData>;
type FlowEdgeData = {
  relation: string;
  originalEdge: KnowledgeGraphEdge;
};
type FlowEdge = Edge<FlowEdgeData>;

type SelectedGraphItem =
  | { kind: "node"; node: KnowledgeGraphNode }
  | { kind: "edge"; edge: KnowledgeGraphEdge };

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
  entity: "сущность",
  claim: "утверждение",
  source: "источник",
  effect: "эффект",
  technology: "технология",
};

const relationLabel: Record<string, string> = {
  supports: "подтверждает",
  support: "подтверждает",
  contains: "содержит",
  has_parameter: "параметр",
  measured_in: "измеряется",
  influences: "влияет",
  increases: "усиливает",
  improves: "улучшает",
  reduces: "снижает",
  contradicts: "конфликт",
  conflicts: "конфликт",
  uses: "использует",
  selected_for: "выбрано для",
  requires: "требует",
  derived_from: "источник",
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
  entity: {
    border: "rgba(45, 212, 191, 0.74)",
    background: "linear-gradient(135deg, #f0fdfa 0%, #99f6e4 100%)",
    color: "#115e59",
    shadow: "0 16px 34px rgba(45, 212, 191, 0.22)",
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

function getNormalizedRelation(relation: string): string {
  return relation.trim().toLowerCase();
}

function getNodeTypeLabel(type: string): string {
  return nodeTypeLabel[type] ?? "другое";
}

function getRelationLabel(relation: string): string {
  return relationLabel[getNormalizedRelation(relation)] ?? "связано";
}

function getNodeVisualStyle(node: KnowledgeGraphNode): NodeVisualStyle {
  return nodeStyleByType[node.type] ?? nodeStyleByType.other;
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

  if (relation === "uses" || relation === "selected_for" || relation === "requires") {
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
        label: `${node.label || node.id}\n${getNodeTypeLabel(node.type)}`,
        originalNode: node,
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
      label: getRelationLabel(edge.label ?? edge.relation),
      data: {
        relation: edge.relation,
        originalEdge: edge,
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

function formatOptionalValue(value: string | number | undefined): string {
  if (value === undefined || value === "" || value === 0) {
    return "—";
  }

  return String(value);
}

function GraphItemDetails({ selectedItem }: { selectedItem: SelectedGraphItem | null }) {
  if (!selectedItem) {
    return (
      <aside className="rounded-xl border border-slate-200 bg-white/85 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Детали графа
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Выберите узел или связь, чтобы увидеть тип, источник и фрагмент доказательства.
        </p>
      </aside>
    );
  }

  if (selectedItem.kind === "node") {
    const { node } = selectedItem;

    return (
      <aside className="rounded-xl border border-ice-100 bg-white/90 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ice-600">
          Детали узла
        </p>
        <h3 className="mt-3 text-base font-semibold leading-6 text-slate-950">
          {node.label || node.id}
        </h3>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Тип
            </dt>
            <dd className="mt-1 text-slate-700">{getNodeTypeLabel(node.type)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              ID
            </dt>
            <dd className="mt-1 break-all text-slate-700">{node.id}</dd>
          </div>
          {node.confidence ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Достоверность
              </dt>
              <dd className="mt-1 text-slate-700">{node.confidence}</dd>
            </div>
          ) : null}
          {node.description ? (
            <div className="md:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Описание
              </dt>
              <dd className="mt-1 leading-6 text-slate-700">{node.description}</dd>
            </div>
          ) : null}
        </dl>
      </aside>
    );
  }

  const { edge } = selectedItem;
  const sourceRef = edge.sourceRef;

  return (
    <aside className="rounded-xl border border-ice-100 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ice-600">
        Детали связи
      </p>
      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Связь
          </dt>
          <dd className="mt-1 text-slate-700">{getRelationLabel(edge.label ?? edge.relation)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            ID
          </dt>
          <dd className="mt-1 break-all text-slate-700">{edge.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Источник
          </dt>
          <dd className="mt-1 text-slate-700">
            {formatOptionalValue(sourceRef?.sourceName ?? sourceRef?.documentTitle)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Страница / chunk
          </dt>
          <dd className="mt-1 text-slate-700">
            {formatOptionalValue(sourceRef?.page)} / {formatOptionalValue(sourceRef?.chunkId)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Document ID
          </dt>
          <dd className="mt-1 break-all text-slate-700">
            {formatOptionalValue(sourceRef?.documentId)}
          </dd>
        </div>
        {edge.evidenceText ? (
          <div className="md:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Фрагмент доказательства
            </dt>
            <dd className="mt-1 leading-6 text-slate-700">{edge.evidenceText}</dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}

export function KnowledgeGraph({ graph, mode = "compact", title = "Граф связей" }: KnowledgeGraphProps) {
  const nodes = useMemo(() => createFlowNodes(graph, mode), [graph, mode]);
  const edges = useMemo(() => createFlowEdges(graph), [graph]);
  const [selectedItem, setSelectedItem] = useState<SelectedGraphItem | null>(null);
  const flowWrapperRef = useRef<HTMLDivElement | null>(null);
  const flowInstanceRef = useRef<ReactFlowInstance<FlowNode, FlowEdge> | null>(null);
  const heightClassName = mode === "compact" ? "h-[360px]" : "h-[640px]";

  useEffect(() => {
    setSelectedItem(null);
  }, [graph]);

  useEffect(() => {
    const wrapperElement = flowWrapperRef.current;

    if (!wrapperElement || nodes.length === 0) {
      return;
    }

    const fitGraphToVisibleArea = () => {
      window.requestAnimationFrame(() => {
        flowInstanceRef.current?.fitView({ padding: 0.18 });
      });
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const visibleEntry = entries.find(
        (entry) => entry.contentRect.width > 0 && entry.contentRect.height > 0,
      );

      if (visibleEntry) {
        fitGraphToVisibleArea();
      }
    });

    resizeObserver.observe(wrapperElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [nodes.length]);

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
          <div
            ref={flowWrapperRef}
            className={`${heightClassName} overflow-hidden rounded-xl border border-slate-200 bg-slate-950`}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onInit={(instance) => {
                flowInstanceRef.current = instance;
              }}
              onNodeClick={(_, node) => {
                setSelectedItem({ kind: "node", node: node.data.originalNode });
              }}
              onEdgeClick={(_, edge) => {
                const originalEdge = edge.data?.originalEdge ?? graph.edges.find((graphEdge) => graphEdge.id === edge.id);

                if (originalEdge) {
                  setSelectedItem({ kind: "edge", edge: originalEdge });
                }
              }}
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
          <GraphItemDetails selectedItem={selectedItem} />
        </div>
      )}
    </SectionCard>
  );
}
