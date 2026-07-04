export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

export type NumericMode = "structured" | "none" | "mixed" | "unknown";

export type NumericStatus = "structured" | "unmatched" | "partial" | "none" | "unknown";

export type ContradictionStatus =
  | "possible"
  | "needs_review"
  | "confirmed"
  | "resolved"
  | "none"
  | "unknown";

export type GapSeverity = "critical" | "high" | "medium" | "low" | "info" | "unknown";

export type DemoScenarioId = "desalination" | "catholyte" | "pgm" | "metals" | string;

export interface DemoScenario {
  id: string;
  title: string;
  query: string;
}

export type NumericOperator =
  | "eq"
  | "equals"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "range"
  | "approximately"
  | "unknown";

export type SourceType =
  | "publication"
  | "reference"
  | "internal_report"
  | "experiment"
  | "patent"
  | "standard"
  | "unknown";

export type GraphNodeType =
  | "material"
  | "process"
  | "technology"
  | "equipment"
  | "condition"
  | "effect"
  | "parameter"
  | "experiment"
  | "source"
  | "contradiction"
  | "gap"
  | "claim"
  | "other";

export type QuerySourceType = "publication" | "report" | "experiment" | "patent" | "standard";

export interface QueryFilters {
  material?: string;
  process?: string;
  geography?: "domestic" | "foreign" | "russia" | "all";
  yearFrom?: number;
  yearTo?: number;
  confidence?: "low" | "medium" | "high";
  sourceTypes?: QuerySourceType[];
}

export interface QueryRequest {
  query: string;
  scenarioId?: string;
  filters?: QueryFilters;
}

export type GraphRelation =
  | "SUPPORTS"
  | "CONTRADICTS"
  | "HAS_PARAMETER"
  | "INFLUENCES"
  | "INCREASES"
  | "REDUCES"
  | "USES"
  | "ASSOCIATED_WITH"
  | "DERIVED_FROM"
  | "HAS_CONDITION"
  | "HAS_EFFECT"
  | "MENTIONS"
  | "CONTAINS"
  | "supports"
  | "contradicts"
  | "has_parameter"
  | "influences"
  | "increases"
  | "reduces"
  | "uses"
  | "associated_with"
  | "derived_from"
  | "has_condition"
  | "has_effect"
  | "mentions"
  | "contains"
  | "unknown";

export type MetadataValue = string | number | boolean | null;

export type Metadata = Record<string, MetadataValue | MetadataValue[]>;

export interface Condition {
  name: string | null;
  operator: NumericOperator;
  value: number | null;
  min: number | null;
  max: number | null;
  unit: string | null;
  rawValue: string | null;
}

export interface SourceRef {
  documentId: string | null;
  sourceName: string | null;
  chunkId: string | null;
  page: number | null;
  sectionTitle: string | null;
  sourceType: SourceType | string | null;
  year: number | null;
  geography: string | null;
}

export interface ParsedQueryTimeRange {
  from?: number | null;
  to?: number | null;
  fromYear?: number | null;
  toYear?: number | null;
  rawValue?: string | null;
}

export interface ParsedQuery {
  intent: string | null;
  materials: string[];
  processes: string[];
  technologies: string[];
  properties: string[];
  conditions: Condition[];
  geography: string | null;
  timeRange: ParsedQueryTimeRange | string | null;
}

export interface AnswerSummary {
  shortConclusion: string;
  confidence: ConfidenceLevel;
  confidenceReason: string | null;
  warnings: string[];
  numericMode: NumericMode;
}

export interface EvidenceItem {
  id: string;
  text: string;
  score: number | null;
  confidence: ConfidenceLevel;
  conditions: Condition[];
  matchedTerms: string[];
  numericStatus: NumericStatus;
  source: SourceRef;
  metadata?: Metadata;
}

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType | string;
  confidence?: ConfidenceLevel | null;
  description?: string | null;
  metadata?: Metadata;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: GraphRelation | string;
  sourceRef?: SourceRef | null;
  evidenceText?: string | null;
  confidence?: ConfidenceLevel | null;
  score?: number | null;
  metadata?: Metadata;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface KnowledgeGap {
  id: string;
  type: string | null;
  title: string;
  description: string;
  severity: GapSeverity;
  relatedSourceRefs?: SourceRef[];
  recommendation?: string | null;
  metadata?: Metadata;
}

export interface Contradiction {
  id: string;
  title: string;
  description: string;
  status: ContradictionStatus;
  severity: GapSeverity;
  sourceA: SourceRef | null;
  sourceB: SourceRef | null;
  evidenceA?: string | null;
  evidenceB?: string | null;
  possibleReason?: string | null;
  recommendation?: string | null;
  metadata?: Metadata;
}

export interface SearchResult {
  queryId?: string;
  mode?: "rag" | "mock";
  parsedQuery: ParsedQuery;
  answer: AnswerSummary;
  evidence: EvidenceItem[];
  graph: KnowledgeGraph;
  gaps: KnowledgeGap[];
  contradictions: Contradiction[];
  sources: SourceRef[];
}
