import type { Condition, Effect, EvidenceClaim } from "../../entities/claim/types";
import type { Contradiction } from "../../entities/contradiction/types";
import type { KnowledgeGap } from "../../entities/gap/types";
import type { ParsedQuery } from "../../entities/query/types";
import type { SourceType } from "../../entities/source/types";
import type { SearchResult } from "../types/search";

export type ReportExportInput = {
  query: string;
  result: SearchResult;
  scenarioTitle?: string;
  generatedAt: string;
};

export type JsonReportPayload = {
  metadata: {
    productName: "R&D Evidence Hub";
    query: string;
    scenarioTitle?: string;
    generatedAt: string;
    note: string;
  };
  result: SearchResult;
};

const sourceTypeLabel: Record<SourceType, string> = {
  scientific_article: "научная статья",
  internal_report: "внутренний отчет",
  patent: "патент",
  experiment_protocol: "протокол эксперимента",
  technical_standard: "технический стандарт",
  reference_book: "справочник",
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
    : "не указан";

  return [
    `- Намерение: ${parsedQuery.intent}`,
    `- Область: ${parsedQuery.domain}`,
    `- Нормализованный вопрос: ${parsedQuery.normalizedQuestion}`,
    `- Материалы: ${formatList(parsedQuery.materials)}`,
    `- Процессы: ${formatList(parsedQuery.processes)}`,
    `- Оборудование и технологии: ${formatList(parsedQuery.equipment)}`,
    `- Целевые параметры: ${formatList(parsedQuery.targetParameters)}`,
    `- Период: ${timeScope}`,
    `- Числовые условия: ${parsedQuery.numericConditions.map(formatCondition).join("; ") || "—"}`,
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
    .map((sourceRef) => `${sourceRef.documentTitle}, стр. ${sourceRef.page}`)
    .join("; ");

  return [
    `### ${contradiction.title}`,
    `- Важность: ${contradiction.severity}`,
    `- Достоверность: ${contradiction.confidence}`,
    `- Описание: ${contradiction.description}`,
    `- Источники: ${sources}`,
    `- Рекомендация: ${contradiction.resolutionHint}`,
  ].join("\n");
}

function formatGap(gap: KnowledgeGap): string {
  return [
    `### ${gap.title}`,
    `- Важность: ${gap.severity}`,
    `- Достоверность: ${gap.confidence}`,
    `- Описание: ${gap.description}`,
    `- Недостающие доказательства: ${gap.missingEvidence}`,
    `- Рекомендация: ${gap.recommendedAction}`,
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
        `- ${source.title} (${sourceTypeLabel[source.sourceType]}, ${source.year}) — надежность: ${source.reliability}`,
    )
    .join("\n");
  const contradictions =
    result.contradictions.length > 0
      ? result.contradictions.map(formatContradiction).join("\n\n")
      : "В выбранном результате нет структурированных противоречий.";
  const gaps =
    result.gaps.length > 0
      ? result.gaps.map(formatGap).join("\n\n")
      : "В выбранном результате нет структурированных пробелов.";

  return [
    `# Отчет по доказательствам: ${result.title}`,
    "",
    `Дата формирования: ${generatedAt}`,
    "Продукт: R&D Evidence Hub",
    scenarioTitle ? `Сценарий анализа: ${scenarioTitle}` : undefined,
    "",
    "## Принцип проверки",
    "Каждый вывод должен иметь проверяемый источник.",
    "",
    "## Исходный запрос",
    query,
    "",
    "## Разбор запроса",
    formatParsedQuery(result.parsedQuery),
    "",
    "## Краткий вывод",
    result.answer.shortConclusion,
    "",
    `- Достоверность: ${result.answer.confidence}`,
    `- Причина оценки: ${result.answer.confidenceReason}`,
    "",
    "### Ключевые выводы",
    result.answer.keyFindings.map((finding) => `- ${finding}`).join("\n"),
    "",
    "### Ограничения",
    result.answer.limitations.map((limitation) => `- ${limitation}`).join("\n") || "- —",
    "",
    "## Таблица доказательств",
    "| Утверждение | Материал | Процесс | Условия | Эффект | Источник | Страница | Достоверность | Год |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    evidenceRows,
    "",
    "## Источники",
    sources || "В выбранном результате нет источников.",
    "",
    "## Противоречия",
    contradictions,
    "",
    "## Пробелы в данных",
    gaps,
    "",
    "## Сводка графа",
    `- Узлы: ${result.graph.nodes.length}`,
    `- Связи: ${result.graph.edges.length}`,
    "",
    "## Примечание",
    "Фактические выводы в отчете должны сохранять связь с источниками, страницами и фрагментами.",
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
      productName: "R&D Evidence Hub",
      query,
      scenarioTitle,
      generatedAt,
      note: "Фактические выводы должны сохранять связь с источниками, страницами и фрагментами.",
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
