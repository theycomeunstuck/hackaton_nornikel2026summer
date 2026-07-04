export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

export type SupportedConfidenceLevel = Exclude<ConfidenceLevel, "unknown">;

export type NumericOperator =
  | "equals"
  | "less_than"
  | "less_than_or_equal"
  | "greater_than"
  | "greater_than_or_equal"
  | "range"
  | "approximately"
  | "unknown";

export type ConditionKind =
  | "concentration"
  | "temperature"
  | "ph"
  | "flow_velocity"
  | "flow_rate"
  | "pressure"
  | "dry_residue"
  | "time"
  | "ratio"
  | "composition"
  | "equipment_setting";

export type SourceType =
  | "scientific_article"
  | "internal_report"
  | "patent"
  | "experiment_protocol"
  | "technical_standard"
  | "reference_book";

export type GraphNodeType =
  | "material"
  | "process"
  | "equipment"
  | "parameter"
  | "condition"
  | "entity"
  | "claim"
  | "source"
  | "effect"
  | "technology";

export type GraphEdgeRelation =
  | "supports"
  | "contradicts"
  | "influences"
  | "requires"
  | "measured_in"
  | "derived_from"
  | "contains"
  | "selected_for";

export type SearchMetadata = Record<string, string | number | boolean>;

export interface Condition {
  id: string;
  kind: ConditionKind;
  parameter: string;
  operator: Exclude<NumericOperator, "unknown">;
  value?: number;
  min?: number;
  max?: number;
  minValue?: number;
  maxValue?: number;
  unit: string;
  rawValue?: string;
  material?: string;
  note?: string;
  name?: string;
}

export interface Effect {
  id: string;
  target: string;
  direction: "increase" | "decrease" | "stabilize" | "enable" | "risk";
  description: string;
  magnitude?: string;
}

export interface SourceRef {
  sourceId: string;
  documentTitle: string;
  sourceType: SourceType;
  year: number;
  page: number;
  chunkId: string;
  section?: string;
  documentId?: string;
  sourceName?: string;
  sectionTitle?: string;
  geography?: string;
}

export interface SourceMetadata {
  id: string;
  title: string;
  sourceType: SourceType;
  year: number;
  authors: string[];
  organization?: string;
  documentId?: string;
  tags: string[];
  reliability: SupportedConfidenceLevel;
  geography?: string;
  language?: string;
  excerpt?: string;
}

export interface ParsedQuery {
  id: string;
  originalText: string;
  normalizedQuestion: string;
  domain: "water_treatment" | "nickel_electrowinning" | "matte_slag_partitioning";
  intent:
    | "technology_selection"
    | "parameter_optimization"
    | "evidence_review"
    | "gap_analysis";
  materials: string[];
  processes: string[];
  equipment: string[];
  targetParameters: string[];
  numericConditions: Condition[];
  technologies?: string[];
  conditions?: Condition[];
  geography?: string[];
  timeScope?: {
    fromYear: number;
    toYear: number;
  };
  timeRange?: {
    fromYear: number;
    toYear: number;
  };
}

export interface AnswerSummary {
  shortConclusion: string;
  confidence: SupportedConfidenceLevel;
  confidenceReason: string;
  keyFindings: string[];
  limitations: string[];
  warnings?: string[];
  recommendations?: string[];
}

export interface EvidenceItem {
  id: string;
  scenarioId: string;
  claimType:
    | "technology_selection"
    | "parameter_range"
    | "process_effect"
    | "material_behavior"
    | "equipment_requirement"
    | "source_limitation";
  statement: string;
  confidence: SupportedConfidenceLevel;
  confidenceReason: string;
  sourceRef: SourceRef;
  conditions: Condition[];
  effects: Effect[];
  materials: string[];
  processes: string[];
  equipment: string[];
  year: number;
  claim?: string;
  technologies?: string[];
  geography?: string;
}

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  confidence?: SupportedConfidenceLevel;
  metadata?: SearchMetadata;
  description?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: GraphEdgeRelation;
  label: string;
  confidence?: SupportedConfidenceLevel;
  sourceRef?: SourceRef;
  evidenceText?: string;
  metadata?: SearchMetadata;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Contradiction {
  id: string;
  scenarioId: string;
  title: string;
  description: string;
  severity: "minor" | "moderate" | "critical";
  claimIds: string[];
  conflictingStatements: string[];
  sourceRefs: SourceRef[];
  confidence: SupportedConfidenceLevel;
  resolutionHint: string;
  topic?: string;
  status?: "possible" | "needs_review" | "confirmed" | "resolved";
  possibleReason?: string;
  recommendation?: string;
}

export interface KnowledgeGap {
  id: string;
  scenarioId: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  affectedMaterials: string[];
  affectedProcesses: string[];
  missingEvidence: string;
  recommendedAction: string;
  confidence: SupportedConfidenceLevel;
  relatedSourceRefs: SourceRef[];
  topic?: string;
  priority?: "low" | "medium" | "high";
  relatedClaimIds?: string[];
  recommendation?: string;
}

export interface SearchResult {
  id: string;
  scenarioId: DemoScenarioId;
  title: string;
  parsedQuery: ParsedQuery;
  answer: AnswerSummary;
  evidence: EvidenceItem[];
  graph: KnowledgeGraph;
  sources: SourceMetadata[];
  contradictions: Contradiction[];
  gaps: KnowledgeGap[];
  generatedAt: string;
}

export type DemoScenarioId =
  | "water-desalination"
  | "nickel-catholyte"
  | "pgm-matte-slag"
  | string;

export interface DemoScenario {
  id: DemoScenarioId;
  title: string;
  description: string;
  defaultQuery: string;
  searchResultId: string;
  tags: string[];
}
