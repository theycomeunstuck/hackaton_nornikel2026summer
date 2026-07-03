import type { ConfidenceLevel } from "../source/types";

export type GraphNodeType =
  | "material"
  | "process"
  | "equipment"
  | "parameter"
  | "claim"
  | "source"
  | "effect"
  | "technology";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  confidence?: ConfidenceLevel;
  metadata?: Record<string, string | number | boolean>;
}

export type GraphEdgeRelation =
  | "supports"
  | "contradicts"
  | "influences"
  | "requires"
  | "measured_in"
  | "derived_from"
  | "contains"
  | "selected_for";

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: GraphEdgeRelation;
  label: string;
  confidence?: ConfidenceLevel;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
