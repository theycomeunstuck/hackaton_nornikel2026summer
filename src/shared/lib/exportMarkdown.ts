import type { Condition, Effect, EvidenceClaim } from "../../entities/claim/types";
import type { Contradiction } from "../../entities/contradiction/types";
import type { KnowledgeGap } from "../../entities/gap/types";
import type { ParsedQuery } from "../../entities/query/types";
import type { SearchResult } from "../types/search";

export type ReportExportInput = {
  query: string;
  result: SearchResult;
  scenarioTitle?: string;
  generatedAt: string;
};

export type JsonReportPayload = {
  metadata: {
    productName: "Научный клубок";
    query: string;
    scenarioTitle?: string;
    generatedAt: string;
    note: string;
  };
  result: SearchResult;
};

function formatList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "—";
}

function formatCondition(condition: Condition): string {
  if (condition.operator === "range") {
    return `${condition.parameter}: ${condition.minValue}-${condition.maxValue} ${condition.unit}`;
  }

  if (condition.value !== undefined) {
    const operatorLabel: Record<Condition["operator"], string> = {
      equals: "=",
      less_than: "<",
      less_than_or_equal: "<=",
      greater_than: ">",
      greater_than_or_equal: ">=",
      range: "",
      approximately: "~",
    };

    return `${condition.parameter}: ${operatorLabel[condition.operator]} ${condition.value} ${condition.unit}`;
  }

  return condition.note ? `${condition.parameter}: ${condition.note}` : `${condition.parameter}: ${condition.unit}`;
}

function formatEffect(effect: Effect): string {
  return `${effect.target} (${effect.direction}): ${effect.description}`;
}

function formatParsedQuery(parsedQuery: ParsedQuery): string {
  const timeScope = parsedQuery.timeScope
    ? `${parsedQuery.timeScope.fromYear}-${parsedQuery.timeScope.toYear}`
    : "not specified";

  return [
    `- Intent: ${parsedQuery.intent}`,
    `- Domain: ${parsedQuery.domain}`,
    `- Normalized question: ${parsedQuery.normalizedQuestion}`,
    `- Materials: ${formatList(parsedQuery.materials)}`,
    `- Processes: ${formatList(parsedQuery.processes)}`,
    `- Equipment / technologies: ${formatList(parsedQuery.equipment)}`,
    `- Target parameters: ${formatList(parsedQuery.targetParameters)}`,
    `- Time range: ${timeScope}`,
    `- Numeric conditions: ${parsedQuery.numericConditions.map(formatCondition).join("; ") || "—"}`,
  ].join("\n");
}

function formatEvidenceRow(claim: EvidenceClaim): string {
  return [
    claim.statement.replace(/\|/g, "\\|"),
    formatList(claim.materials).replace(/\|/g, "\\|"),
    formatList(claim.processes).replace(/\|/g, "\\|"),
    claim.conditions.map(formatCondition).join("; ").replace(/\|/g, "\\|") || "—",
    claim.effects.map(formatEffect).join("; ").replace(/\|/g, "\\|") || "—",
    claim.sourceRef.documentTitle.replace(/\|/g, "\\|"),
    String(claim.sourceRef.page),
    claim.confidence,
    String(claim.year),
  ].join(" | ");
}

function formatContradiction(contradiction: Contradiction): string {
  const sources = contradiction.sourceRefs
    .map((sourceRef) => `${sourceRef.documentTitle}, p. ${sourceRef.page}`)
    .join("; ");

  return [
    `### ${contradiction.title}`,
    `- Severity: ${contradiction.severity}`,
    `- Confidence: ${contradiction.confidence}`,
    `- Description: ${contradiction.description}`,
    `- Sources: ${sources}`,
    `- Resolution hint: ${contradiction.resolutionHint}`,
  ].join("\n");
}

function formatGap(gap: KnowledgeGap): string {
  return [
    `### ${gap.title}`,
    `- Severity: ${gap.severity}`,
    `- Confidence: ${gap.confidence}`,
    `- Description: ${gap.description}`,
    `- Missing evidence: ${gap.missingEvidence}`,
    `- Recommended action: ${gap.recommendedAction}`,
  ].join("\n");
}

export function buildMarkdownReport({
  query,
  result,
  scenarioTitle,
  generatedAt,
}: ReportExportInput): string {
  const evidenceRows = result.evidence.map(formatEvidenceRow).join("\n");
  const sources = result.sources
    .map(
      (source) =>
        `- ${source.title} (${source.sourceType}, ${source.year}) — reliability: ${source.reliability}`,
    )
    .join("\n");
  const contradictions =
    result.contradictions.length > 0
      ? result.contradictions.map(formatContradiction).join("\n\n")
      : "No structured contradictions in the selected result.";
  const gaps =
    result.gaps.length > 0
      ? result.gaps.map(formatGap).join("\n\n")
      : "No structured knowledge gaps in the selected result.";

  return [
    `# Evidence report: ${result.title}`,
    "",
    `Generated at: ${generatedAt}`,
    `Product: Научный клубок`,
    scenarioTitle ? `Demo scenario: ${scenarioTitle}` : undefined,
    "",
    "## Source principle",
    "Нет источника — нет фактического утверждения.",
    "",
    "## Original query",
    query,
    "",
    "## Parsed query",
    formatParsedQuery(result.parsedQuery),
    "",
    "## Answer summary",
    result.answer.shortConclusion,
    "",
    `- Confidence: ${result.answer.confidence}`,
    `- Confidence reason: ${result.answer.confidenceReason}`,
    "",
    "### Key findings",
    result.answer.keyFindings.map((finding) => `- ${finding}`).join("\n"),
    "",
    "### Limitations",
    result.answer.limitations.map((limitation) => `- ${limitation}`).join("\n") || "- —",
    "",
    "## Evidence table",
    "| Claim | Material | Process | Conditions | Effect | Source | Page | Confidence | Year |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    evidenceRows,
    "",
    "## Sources",
    sources || "No sources in the selected result.",
    "",
    "## Contradictions",
    contradictions,
    "",
    "## Knowledge gaps",
    gaps,
    "",
    "## Graph summary",
    `- Nodes: ${result.graph.nodes.length}`,
    `- Edges: ${result.graph.edges.length}`,
    "",
    "## Report note",
    "All factual claims in this report must remain connected to source references, pages and chunks.",
    "",
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}

export function buildJsonReport({
  query,
  result,
  scenarioTitle,
  generatedAt,
}: ReportExportInput): string {
  const payload: JsonReportPayload = {
    metadata: {
      productName: "Научный клубок",
      query,
      scenarioTitle,
      generatedAt,
      note: "All factual claims must remain connected to source references, pages and chunks.",
    },
    result,
  };

  return JSON.stringify(payload, null, 2);
}

export function createReportFilename(title: string, extension: "md" | "json"): string {
  const normalizedTitle = title
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-|-$/g, "");

  return `${normalizedTitle || "evidence-report"}.${extension}`;
}
