import type {
  AnswerSummary,
  Condition,
  ConditionKind,
  Contradiction,
  EvidenceItem,
  Effect,
  GraphEdge,
  GraphEdgeRelation,
  GraphNode,
  GraphNodeType,
  KnowledgeGap,
  NumericOperator,
  ParsedQuery,
  SearchMetadata,
  SearchResult,
  SourceMetadata,
  SourceRef,
  SourceType,
  SupportedConfidenceLevel,
} from "../types/search";

type UnknownRecord = Record<string, unknown>;

const supportedConfidenceLevels: SupportedConfidenceLevel[] = ["high", "medium", "low"];

const sourceTypes: SourceType[] = [
  "scientific_article",
  "internal_report",
  "patent",
  "experiment_protocol",
  "technical_standard",
  "reference_book",
];

const conditionKinds: ConditionKind[] = [
  "concentration",
  "temperature",
  "ph",
  "flow_velocity",
  "flow_rate",
  "pressure",
  "dry_residue",
  "time",
  "ratio",
  "composition",
  "equipment_setting",
];

const numericOperators: Array<Exclude<NumericOperator, "unknown">> = [
  "equals",
  "less_than",
  "less_than_or_equal",
  "greater_than",
  "greater_than_or_equal",
  "range",
  "approximately",
];

const graphNodeTypes: GraphNodeType[] = [
  "material",
  "process",
  "equipment",
  "parameter",
  "claim",
  "source",
  "effect",
  "technology",
];

const graphEdgeRelations: GraphEdgeRelation[] = [
  "supports",
  "contradicts",
  "influences",
  "requires",
  "measured_in",
  "derived_from",
  "contains",
  "selected_for",
];

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getStringArray(value: unknown): string[] {
  return getArray(value).filter((item): item is string => typeof item === "string");
}

function getRecordArray(value: unknown): UnknownRecord[] {
  return getArray(value).filter(isRecord);
}

function getEnumValue<T extends string>(value: unknown, allowedValues: readonly T[], fallback: T): T {
  return typeof value === "string" && allowedValues.includes(value as T)
    ? (value as T)
    : fallback;
}

function normalizeConfidence(value: unknown): SupportedConfidenceLevel {
  return getEnumValue(value, supportedConfidenceLevels, "medium");
}

function normalizeSourceType(value: unknown): SourceType {
  return getEnumValue(value, sourceTypes, "internal_report");
}

function normalizeMetadata(value: unknown): SearchMetadata | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string | number | boolean] =>
      typeof entry[1] === "string" ||
      typeof entry[1] === "number" ||
      typeof entry[1] === "boolean",
  );

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeCondition(raw: unknown, index: number): Condition {
  const record = getRecord(raw);

  return {
    id: getString(record.id, `condition-${index + 1}`),
    kind: getEnumValue(record.kind, conditionKinds, "equipment_setting"),
    parameter: getString(record.parameter ?? record.name, "Параметр"),
    operator: getEnumValue(record.operator, numericOperators, "equals"),
    value: typeof record.value === "number" ? record.value : undefined,
    min: typeof record.min === "number" ? record.min : undefined,
    max: typeof record.max === "number" ? record.max : undefined,
    minValue: typeof record.minValue === "number" ? record.minValue : undefined,
    maxValue: typeof record.maxValue === "number" ? record.maxValue : undefined,
    unit: getString(record.unit),
    rawValue: getString(record.rawValue, undefined),
    material: getString(record.material, undefined),
    note: getString(record.note, undefined),
    name: getString(record.name, undefined),
  };
}

function normalizeEffect(raw: unknown, index: number): Effect {
  const record = getRecord(raw);

  return {
    id: getString(record.id, `effect-${index + 1}`),
    target: getString(record.target, "Результат"),
    direction: getEnumValue(
      record.direction,
      ["increase", "decrease", "stabilize", "enable", "risk"],
      "enable",
    ),
    description: getString(record.description, "Эффект не описан."),
    magnitude: getString(record.magnitude, undefined),
  };
}

function normalizeSourceRef(raw: unknown, index: number): SourceRef {
  const record = isRecord(raw) ? raw : {};
  const sourceRecord = isRecord(record.source) ? record.source : {};
  const fallbackId = `source-${index + 1}`;

  return {
    sourceId: getString(record.sourceId ?? record.id ?? sourceRecord.id, fallbackId),
    documentTitle: getString(
      record.documentTitle ?? record.sourceName ?? sourceRecord.title ?? sourceRecord.name,
      "Источник без названия",
    ),
    sourceType: normalizeSourceType(record.sourceType ?? sourceRecord.sourceType ?? sourceRecord.type),
    year: getNumber(record.year ?? sourceRecord.year, 0),
    page: getNumber(record.page, 0),
    chunkId: getString(record.chunkId, `chunk-${index + 1}`),
    section: getString(record.section, undefined),
    documentId: getString(record.documentId ?? sourceRecord.documentId, undefined),
    sourceName: getString(record.sourceName ?? sourceRecord.name, undefined),
    sectionTitle: getString(record.sectionTitle, undefined),
    geography: getString(record.geography ?? sourceRecord.geography, undefined),
  };
}

function normalizeSourceMetadata(raw: unknown, index: number): SourceMetadata {
  const record = getRecord(raw);

  return {
    id: getString(record.id ?? record.sourceId, `source-${index + 1}`),
    title: getString(record.title ?? record.sourceName ?? record.documentTitle, "Источник без названия"),
    sourceType: normalizeSourceType(record.sourceType ?? record.type),
    year: getNumber(record.year, 0),
    authors: getStringArray(record.authors),
    organization: getString(record.organization, undefined),
    documentId: getString(record.documentId, undefined),
    tags: getStringArray(record.tags),
    reliability: normalizeConfidence(record.reliability ?? record.confidence),
    geography: getString(record.geography, undefined),
    language: getString(record.language, undefined),
    excerpt: getString(record.excerpt, undefined),
  };
}

function normalizeEvidenceItem(raw: unknown, index: number, scenarioId: string): EvidenceItem {
  const record = getRecord(raw);
  const sourceRef = normalizeSourceRef(record.sourceRef ?? record.source, index);

  return {
    id: getString(record.id, `evidence-${index + 1}`),
    scenarioId: getString(record.scenarioId, scenarioId),
    claimType: getEnumValue(
      record.claimType,
      [
        "technology_selection",
        "parameter_range",
        "process_effect",
        "material_behavior",
        "equipment_requirement",
        "source_limitation",
      ],
      "source_limitation",
    ),
    statement: getString(record.statement ?? record.claim, "Утверждение не указано."),
    confidence: normalizeConfidence(record.confidence),
    confidenceReason: getString(record.confidenceReason, "Причина достоверности не указана."),
    sourceRef,
    conditions: getRecordArray(record.conditions).map(normalizeCondition),
    effects: getRecordArray(record.effects).map(normalizeEffect),
    materials: getStringArray(record.materials),
    processes: getStringArray(record.processes),
    equipment: getStringArray(record.equipment),
    year: getNumber(record.year ?? sourceRef.year, sourceRef.year),
    claim: getString(record.claim, undefined),
    technologies: getStringArray(record.technologies),
    geography: getString(record.geography ?? sourceRef.geography, undefined),
  };
}

function normalizeParsedQuery(raw: unknown): ParsedQuery {
  const record = getRecord(raw);

  return {
    id: getString(record.id, "parsed-query"),
    originalText: getString(record.originalText ?? record.query),
    normalizedQuestion: getString(record.normalizedQuestion ?? record.originalText ?? record.query),
    domain: getEnumValue(
      record.domain,
      ["water_treatment", "nickel_electrowinning", "matte_slag_partitioning"],
      "water_treatment",
    ),
    intent: getEnumValue(
      record.intent,
      ["technology_selection", "parameter_optimization", "evidence_review", "gap_analysis"],
      "evidence_review",
    ),
    materials: getStringArray(record.materials),
    processes: getStringArray(record.processes),
    equipment: getStringArray(record.equipment),
    targetParameters: getStringArray(record.targetParameters),
    numericConditions: getRecordArray(record.numericConditions ?? record.conditions).map(
      normalizeCondition,
    ),
    technologies: getStringArray(record.technologies),
    conditions: getRecordArray(record.conditions).map(normalizeCondition),
    geography: getStringArray(record.geography),
  };
}

function normalizeAnswer(raw: unknown): AnswerSummary {
  const record = getRecord(raw);

  return {
    shortConclusion: getString(record.shortConclusion ?? record.summary, "Краткий вывод не указан."),
    confidence: normalizeConfidence(record.confidence),
    confidenceReason: getString(record.confidenceReason, "Причина достоверности не указана."),
    keyFindings: getStringArray(record.keyFindings),
    limitations: getStringArray(record.limitations),
    warnings: getStringArray(record.warnings),
    recommendations: getStringArray(record.recommendations),
  };
}

function normalizeGraphNode(raw: unknown, index: number): GraphNode {
  const record = getRecord(raw);

  return {
    id: getString(record.id, `node-${index + 1}`),
    type: getEnumValue(record.type, graphNodeTypes, "claim"),
    label: getString(record.label ?? record.title, `Узел ${index + 1}`),
    confidence: isSupportedConfidence(record.confidence)
      ? normalizeConfidence(record.confidence)
      : undefined,
    metadata: normalizeMetadata(record.metadata),
    description: getString(record.description, undefined),
  };
}

function normalizeGraphEdge(raw: unknown, index: number): GraphEdge {
  const record = getRecord(raw);

  return {
    id: getString(record.id, `edge-${index + 1}`),
    source: getString(record.source),
    target: getString(record.target),
    relation: getEnumValue(record.relation, graphEdgeRelations, "supports"),
    label: getString(record.label ?? record.relation, "supports"),
    confidence: isSupportedConfidence(record.confidence)
      ? normalizeConfidence(record.confidence)
      : undefined,
    sourceRef: isRecord(record.sourceRef) ? normalizeSourceRef(record.sourceRef, index) : undefined,
    evidenceText: getString(record.evidenceText, undefined),
    metadata: normalizeMetadata(record.metadata),
  };
}

function isSupportedConfidence(value: unknown): value is SupportedConfidenceLevel {
  return typeof value === "string" && supportedConfidenceLevels.includes(value as SupportedConfidenceLevel);
}

function normalizeContradiction(raw: unknown, index: number, scenarioId: string): Contradiction {
  const record = getRecord(raw);

  return {
    id: getString(record.id, `contradiction-${index + 1}`),
    scenarioId: getString(record.scenarioId, scenarioId),
    title: getString(record.title ?? record.topic, "Противоречие"),
    description: getString(record.description, "Описание противоречия не указано."),
    severity: getEnumValue(record.severity, ["minor", "moderate", "critical"], "moderate"),
    claimIds: getStringArray(record.claimIds),
    conflictingStatements: getStringArray(record.conflictingStatements),
    sourceRefs: getRecordArray(record.sourceRefs).map(normalizeSourceRef),
    confidence: normalizeConfidence(record.confidence),
    resolutionHint: getString(record.resolutionHint ?? record.possibleReason, "Требуется экспертная проверка."),
    topic: getString(record.topic, undefined),
    status: getEnumValue(record.status, ["possible", "confirmed", "resolved"] as const, "possible"),
    possibleReason: getString(record.possibleReason, undefined),
    recommendation: getString(record.recommendation, undefined),
  };
}

function normalizeGap(raw: unknown, index: number, scenarioId: string): KnowledgeGap {
  const record = getRecord(raw);

  return {
    id: getString(record.id, `gap-${index + 1}`),
    scenarioId: getString(record.scenarioId, scenarioId),
    title: getString(record.title ?? record.topic, "Пробел в знаниях"),
    description: getString(record.description, "Описание пробела не указано."),
    severity: getEnumValue(record.severity, ["low", "medium", "high"], "medium"),
    affectedMaterials: getStringArray(record.affectedMaterials),
    affectedProcesses: getStringArray(record.affectedProcesses),
    missingEvidence: getString(record.missingEvidence, "Недостающие данные не указаны."),
    recommendedAction: getString(record.recommendedAction ?? record.recommendation, "Уточнить источники."),
    confidence: normalizeConfidence(record.confidence),
    relatedSourceRefs: getRecordArray(record.relatedSourceRefs).map(normalizeSourceRef),
    topic: getString(record.topic, undefined),
    priority: getEnumValue(record.priority, ["low", "medium", "high"] as const, "medium"),
    relatedClaimIds: getStringArray(record.relatedClaimIds),
    recommendation: getString(record.recommendation, undefined),
  };
}

function deriveSourcesFromEvidence(evidence: EvidenceItem[]): SourceMetadata[] {
  const sourceMap = new Map<string, SourceMetadata>();

  evidence.forEach((item) => {
    const ref = item.sourceRef;

    if (!sourceMap.has(ref.sourceId)) {
      sourceMap.set(ref.sourceId, {
        id: ref.sourceId,
        title: ref.documentTitle,
        sourceType: ref.sourceType,
        year: ref.year,
        authors: [],
        documentId: ref.documentId,
        tags: [],
        reliability: item.confidence,
        geography: ref.geography,
      });
    }
  });

  return Array.from(sourceMap.values());
}

export function normalizeSearchResult(raw: unknown): SearchResult {
  const record = getRecord(raw);
  const scenarioId = getString(record.scenarioId, "raw-scenario");
  const evidence = getRecordArray(record.evidence).map((item, index) =>
    normalizeEvidenceItem(item, index, scenarioId),
  );
  const explicitSources = getRecordArray(record.sources).map(normalizeSourceMetadata);
  const sources = explicitSources.length > 0 ? explicitSources : deriveSourcesFromEvidence(evidence);
  const graphRecord = getRecord(record.graph);

  return {
    id: getString(record.id, "normalized-search-result"),
    scenarioId,
    title: getString(record.title, "Нормализованный результат поиска"),
    parsedQuery: normalizeParsedQuery(record.parsedQuery),
    answer: normalizeAnswer(record.answer),
    evidence,
    graph: {
      nodes: getRecordArray(graphRecord.nodes).map(normalizeGraphNode),
      edges: getRecordArray(graphRecord.edges).map(normalizeGraphEdge),
    },
    sources,
    contradictions: getRecordArray(record.contradictions).map((item, index) =>
      normalizeContradiction(item, index, scenarioId),
    ),
    gaps: getRecordArray(record.gaps).map((item, index) => normalizeGap(item, index, scenarioId)),
    generatedAt: getString(record.generatedAt, new Date().toISOString()),
  };
}
