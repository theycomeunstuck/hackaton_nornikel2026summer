import type {
  AnswerSummary as RagAnswerSummary,
  Condition as RagCondition,
  ConfidenceLevel as RagConfidenceLevel,
  Contradiction as RagContradiction,
  EvidenceItem as RagEvidenceItem,
  GapSeverity,
  GraphEdge as RagGraphEdge,
  GraphNode as RagGraphNode,
  KnowledgeGap as RagKnowledgeGap,
  SearchResult as RagSearchResult,
  SourceRef as RagSourceRef,
} from "../types/rag";
import type {
  AnswerSummary,
  Condition,
  Contradiction,
  EvidenceItem,
  GraphEdge,
  GraphNode,
  KnowledgeGap,
  SearchResult,
  SourceMetadata,
  SourceRef,
  SourceType,
  SupportedConfidenceLevel,
} from "../types/search";

type UiContradictionStatus = NonNullable<Contradiction["status"]>;

type EvidenceItemWithRagFields = EvidenceItem & {
  score?: number;
  numericStatus?: string;
  matchedTerms?: string[];
};

function toSupportedConfidence(confidence: RagConfidenceLevel): SupportedConfidenceLevel {
  return confidence === "high" || confidence === "medium" || confidence === "low"
    ? confidence
    : "medium";
}

function toSourceType(sourceType: string | null): SourceType {
  if (sourceType === "reference") {
    return "reference_book";
  }

  if (sourceType === "internal_report") {
    return "internal_report";
  }

  if (sourceType === "patent") {
    return "patent";
  }

  if (sourceType === "standard") {
    return "technical_standard";
  }

  return "scientific_article";
}

function toConditionOperator(
  operator: RagCondition["operator"],
): Exclude<Condition["operator"], "unknown"> {
  const operatorMap: Record<RagCondition["operator"], Exclude<Condition["operator"], "unknown">> = {
    eq: "equals",
    equals: "equals",
    lt: "less_than",
    lte: "less_than_or_equal",
    gt: "greater_than",
    gte: "greater_than_or_equal",
    range: "range",
    approximately: "approximately",
    unknown: "equals",
  };

  return operatorMap[operator];
}

function toCondition(condition: RagCondition, index: number): Condition {
  return {
    id: `${condition.name ?? "condition"}-${index + 1}`,
    kind: "equipment_setting",
    parameter: condition.name ?? "Параметр",
    operator: toConditionOperator(condition.operator),
    value: condition.value ?? undefined,
    min: condition.min ?? undefined,
    max: condition.max ?? undefined,
    minValue: condition.min ?? undefined,
    maxValue: condition.max ?? undefined,
    unit: condition.unit ?? "",
    rawValue: condition.rawValue ?? undefined,
    name: condition.name ?? undefined,
  };
}

function getSourceId(source: RagSourceRef, index: number): string {
  return source.chunkId ?? source.documentId ?? `rag-source-${index + 1}`;
}

function toSourceRef(source: RagSourceRef, index: number): SourceRef {
  const sourceId = getSourceId(source, index);
  const sourceName = source.sourceName ?? "Источник без названия";

  return {
    sourceId,
    documentTitle: sourceName,
    sourceType: toSourceType(source.sourceType),
    year: source.year ?? 0,
    page: source.page ?? 0,
    chunkId: source.chunkId ?? sourceId,
    documentId: source.documentId ?? undefined,
    sourceName,
    sectionTitle: source.sectionTitle ?? undefined,
    geography: source.geography ?? undefined,
  };
}

export function adaptRagSourceRefs(sources: RagSourceRef[]): SourceRef[] {
  return sources.map(toSourceRef);
}

function toAnswerSummary(answer: RagAnswerSummary): AnswerSummary {
  return {
    shortConclusion: answer.shortConclusion,
    confidence: toSupportedConfidence(answer.confidence),
    confidenceReason: answer.confidenceReason ?? "Причина достоверности не указана.",
    keyFindings: [],
    limitations: [],
    warnings: answer.warnings,
  };
}

function toEvidenceItem(item: RagEvidenceItem, index: number): EvidenceItemWithRagFields {
  const sourceRef = toSourceRef(item.source, index);

  return {
    id: item.id,
    scenarioId: "rag",
    claimType: "source_limitation",
    statement: item.text,
    confidence: toSupportedConfidence(item.confidence),
    confidenceReason: "Достоверность получена из RAG результата.",
    sourceRef,
    conditions: item.conditions.map(toCondition),
    effects: [],
    materials: [],
    processes: [],
    equipment: [],
    year: sourceRef.year,
    geography: sourceRef.geography,
    score: item.score ?? undefined,
    numericStatus: item.numericStatus,
    matchedTerms: item.matchedTerms,
  };
}

function toGraphNode(node: RagGraphNode): GraphNode {
  const supportedTypes: GraphNode["type"][] = [
    "material",
    "process",
    "equipment",
    "parameter",
    "condition",
    "entity",
    "claim",
    "source",
    "effect",
    "technology",
  ];
  const nodeType = supportedTypes.includes(node.type as GraphNode["type"])
    ? (node.type as GraphNode["type"])
    : "claim";

  return {
    id: node.id,
    type: nodeType,
    label: node.label,
    confidence: node.confidence ? toSupportedConfidence(node.confidence) : undefined,
    description: node.description ?? undefined,
  };
}

function toGraphRelation(relation: string): GraphEdge["relation"] {
  const normalizedRelation = relation.toLowerCase();

  if (normalizedRelation.includes("contradict")) {
    return "contradicts";
  }

  if (normalizedRelation.includes("influence") || normalizedRelation.includes("increase")) {
    return "influences";
  }

  if (normalizedRelation.includes("use")) {
    return "requires";
  }

  if (normalizedRelation.includes("source") || normalizedRelation.includes("derived")) {
    return "derived_from";
  }

  if (normalizedRelation.includes("contain") || normalizedRelation.includes("parameter")) {
    return "contains";
  }

  return "supports";
}

function toGraphEdge(edge: RagGraphEdge, index: number): GraphEdge {
  const relation = toGraphRelation(edge.relation);

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    relation,
    label: edge.relation,
    confidence: edge.confidence ? toSupportedConfidence(edge.confidence) : undefined,
    sourceRef: edge.sourceRef ? toSourceRef(edge.sourceRef, index) : undefined,
    evidenceText: edge.evidenceText ?? undefined,
  };
}

function toSourceMetadata(source: RagSourceRef, index: number): SourceMetadata {
  const sourceRef = toSourceRef(source, index);

  return {
    id: sourceRef.sourceId,
    title: sourceRef.documentTitle,
    sourceType: sourceRef.sourceType,
    year: sourceRef.year,
    authors: [],
    documentId: sourceRef.documentId,
    tags: [],
    reliability: "medium",
    geography: sourceRef.geography,
  };
}

function toOldSeverity(severity: GapSeverity): KnowledgeGap["severity"] {
  if (severity === "high" || severity === "critical") {
    return "high";
  }

  if (severity === "medium") {
    return "medium";
  }

  return "low";
}

function toContradictionStatus(status: RagContradiction["status"]): UiContradictionStatus {
  if (status === "confirmed" || status === "resolved" || status === "possible") {
    return status;
  }

  return "needs_review";
}

function toContradiction(contradiction: RagContradiction, index: number): Contradiction {
  const sourceRefs = [contradiction.sourceA, contradiction.sourceB]
    .filter((source): source is RagSourceRef => source !== null)
    .map(toSourceRef);

  return {
    id: contradiction.id,
    scenarioId: "rag",
    title: contradiction.title,
    description: contradiction.description,
    severity: contradiction.severity === "critical" ? "critical" : "moderate",
    claimIds: [],
    conflictingStatements: [contradiction.evidenceA, contradiction.evidenceB].filter(
      (text): text is string => typeof text === "string" && text.length > 0,
    ),
    sourceRefs,
    confidence: "medium",
    resolutionHint: contradiction.recommendation ?? "Требуется экспертная проверка.",
    status: toContradictionStatus(contradiction.status),
    possibleReason: contradiction.possibleReason ?? undefined,
    recommendation: contradiction.recommendation ?? undefined,
    topic: `RAG contradiction ${index + 1}`,
  };
}

function toKnowledgeGap(gap: RagKnowledgeGap): KnowledgeGap {
  return {
    id: gap.id,
    scenarioId: "rag",
    title: gap.title,
    description: gap.description,
    severity: toOldSeverity(gap.severity),
    affectedMaterials: [],
    affectedProcesses: [],
    missingEvidence: gap.description,
    recommendedAction: gap.recommendation ?? "Уточнить источники и условия применимости.",
    confidence: "medium",
    relatedSourceRefs: (gap.relatedSourceRefs ?? []).map(toSourceRef),
    recommendation: gap.recommendation ?? undefined,
  };
}

export function adaptRagSearchResult(result: RagSearchResult): SearchResult {
  return {
    id: "rag-search-result",
    scenarioId: "rag",
    title: "RAG SearchResult",
    parsedQuery: {
      id: "rag-parsed-query",
      originalText: "",
      normalizedQuestion: "",
      domain: "water_treatment",
      intent: "evidence_review",
      materials: result.parsedQuery.materials,
      processes: result.parsedQuery.processes,
      equipment: [],
      targetParameters: result.parsedQuery.properties,
      numericConditions: result.parsedQuery.conditions.map(toCondition),
      technologies: result.parsedQuery.technologies,
      conditions: result.parsedQuery.conditions.map(toCondition),
      geography:
        result.parsedQuery.geography && result.parsedQuery.geography !== "all"
          ? [result.parsedQuery.geography]
          : [],
    },
    answer: toAnswerSummary(result.answer),
    evidence: result.evidence.map(toEvidenceItem),
    graph: {
      nodes: result.graph.nodes.map(toGraphNode),
      edges: result.graph.edges.map(toGraphEdge),
    },
    sources: result.sources.map(toSourceMetadata),
    contradictions: result.contradictions.map(toContradiction),
    gaps: result.gaps.map(toKnowledgeGap),
    generatedAt: new Date().toISOString(),
  };
}
