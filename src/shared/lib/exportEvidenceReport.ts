import type {
  Condition,
  Contradiction,
  EvidenceItem,
  KnowledgeGap,
  SearchResult,
  SourceMetadata,
  SourceRef,
} from "../types/search";

const operatorLabel: Record<Condition["operator"], string> = {
  equals: "=",
  less_than: "<",
  less_than_or_equal: "<=",
  greater_than: ">",
  greater_than_or_equal: ">=",
  range: "",
  approximately: "~",
};

function escapeTableCell(value: string | number | undefined): string {
  if (value === undefined || value === "") {
    return "-";
  }

  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function formatList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "-";
}

function formatConditionValue(condition: Condition): string {
  if (condition.operator === "range") {
    const min = condition.min ?? condition.minValue;
    const max = condition.max ?? condition.maxValue;

    if (min !== undefined && max !== undefined) {
      return `${min}-${max}`;
    }
  }

  if (condition.value !== undefined) {
    return `${operatorLabel[condition.operator]} ${condition.value}`;
  }

  return condition.rawValue ?? condition.note ?? "-";
}

function formatCondition(condition: Condition): string {
  const name = condition.name ?? condition.parameter;
  const unit = condition.unit ? ` ${condition.unit}` : "";

  return `${name}: ${formatConditionValue(condition)}${unit}`;
}

function formatSourceRef(sourceRef: SourceRef): string {
  const sourceName = sourceRef.sourceName ?? sourceRef.documentTitle;

  return `${sourceName}, page ${sourceRef.page}, ${sourceRef.chunkId}`;
}

function formatParsedQuery(result: SearchResult): string {
  const { parsedQuery } = result;
  const timeRange = parsedQuery.timeRange ?? parsedQuery.timeScope;
  const conditions = parsedQuery.conditions ?? parsedQuery.numericConditions;

  return [
    `- Intent: ${parsedQuery.intent}`,
    `- Domain: ${parsedQuery.domain}`,
    `- Original query: ${parsedQuery.originalText}`,
    `- Normalized question: ${parsedQuery.normalizedQuestion}`,
    `- Materials: ${formatList(parsedQuery.materials)}`,
    `- Processes: ${formatList(parsedQuery.processes)}`,
    `- Technologies: ${formatList(parsedQuery.technologies ?? [])}`,
    `- Equipment: ${formatList(parsedQuery.equipment)}`,
    `- Target parameters: ${formatList(parsedQuery.targetParameters)}`,
    `- Geography: ${formatList(parsedQuery.geography ?? [])}`,
    `- Time range: ${timeRange ? `${timeRange.fromYear}-${timeRange.toYear}` : "-"}`,
    `- Conditions: ${conditions.length > 0 ? conditions.map(formatCondition).join("; ") : "-"}`,
  ].join("\n");
}

function formatEvidenceRows(evidence: EvidenceItem[]): string {
  if (evidence.length === 0) {
    return "| - | - | - | - | - | - |\n";
  }

  return evidence
    .map((item) =>
      [
        escapeTableCell(item.statement),
        escapeTableCell(item.conditions.map(formatCondition).join("; ")),
        escapeTableCell(formatSourceRef(item.sourceRef)),
        escapeTableCell(item.confidence),
        escapeTableCell(item.year),
        escapeTableCell(item.geography ?? item.sourceRef.geography),
      ].join(" | "),
    )
    .map((row) => `| ${row} |`)
    .join("\n");
}

function formatSource(source: SourceMetadata): string {
  const geography = source.geography ? `, geography: ${source.geography}` : "";
  const documentId = source.documentId ? `, documentId: ${source.documentId}` : "";

  return `- ${source.title} (${source.sourceType}, ${source.year}, reliability: ${source.reliability}${geography}${documentId})`;
}

function formatSources(result: SearchResult): string {
  if (result.sources.length > 0) {
    return result.sources.map(formatSource).join("\n");
  }

  const uniqueSourceRefs = new Map<string, SourceRef>();

  result.evidence.forEach((item) => {
    const key = `${item.sourceRef.sourceId}:${item.sourceRef.chunkId}:${item.sourceRef.page}`;
    uniqueSourceRefs.set(key, item.sourceRef);
  });

  if (uniqueSourceRefs.size === 0) {
    return "- No sources available.";
  }

  return Array.from(uniqueSourceRefs.values())
    .map((sourceRef) => `- ${formatSourceRef(sourceRef)} (${sourceRef.sourceType}, ${sourceRef.year})`)
    .join("\n");
}

function formatContradiction(contradiction: Contradiction): string {
  const status = contradiction.status ?? "not specified";
  const sources =
    contradiction.sourceRefs.length > 0
      ? contradiction.sourceRefs.map(formatSourceRef).join("; ")
      : "-";

  return [
    `### ${contradiction.title}`,
    `- Status: ${status}`,
    `- Severity: ${contradiction.severity}`,
    `- Description: ${contradiction.description}`,
    `- Sources: ${sources}`,
  ].join("\n");
}

function formatContradictions(contradictions: Contradiction[]): string {
  if (contradictions.length === 0) {
    return "No structured contradictions found.";
  }

  return contradictions.map(formatContradiction).join("\n\n");
}

function formatGap(gap: KnowledgeGap): string {
  return [
    `### ${gap.title}`,
    `- Severity: ${gap.severity}`,
    `- Description: ${gap.description}`,
  ].join("\n");
}

function formatGaps(gaps: KnowledgeGap[]): string {
  if (gaps.length === 0) {
    return "No structured knowledge gaps found.";
  }

  return gaps.map(formatGap).join("\n\n");
}

export function buildEvidenceReportMarkdown(result: SearchResult): string {
  return [
    "# Evidence Report",
    "",
    `Title: ${result.title}`,
    `Generated at: ${result.generatedAt}`,
    `Scenario: ${result.scenarioId}`,
    "",
    "## Query understanding",
    formatParsedQuery(result),
    "",
    "## Short conclusion",
    result.answer.shortConclusion,
    "",
    "## Confidence",
    `- Level: ${result.answer.confidence}`,
    `- Reason: ${result.answer.confidenceReason}`,
    "",
    "## Evidence fragments",
    "| Evidence fragment | Conditions | Source | Confidence | Year | Geography |",
    "| --- | --- | --- | --- | --- | --- |",
    formatEvidenceRows(result.evidence),
    "",
    "## Sources",
    formatSources(result),
    "",
    "## Contradictions",
    formatContradictions(result.contradictions),
    "",
    "## Knowledge gaps",
    formatGaps(result.gaps),
    "",
  ].join("\n");
}
