import type { EvidenceClaim } from "../../entities/claim/types";
import type { Contradiction } from "../../entities/contradiction/types";
import type { Document } from "../../entities/document/types";
import type { KnowledgeGap } from "../../entities/gap/types";
import type { SourceMetadata, SourceType } from "../../entities/source/types";
import { mockContradictions } from "../mock/contradictions.mock";
import { demoScenarios } from "../mock/demoScenarios.mock";
import { mockDocuments } from "../mock/documents.mock";
import { mockGaps } from "../mock/gaps.mock";
import { mockSearchResults } from "../mock/searchResults.mock";
import { mockSources } from "../mock/sources.mock";
import type { DemoScenario, SearchResult } from "../types/search";

export type DashboardMetric = {
  label: string;
  value: string;
  description: string;
  tone: "cyan" | "green" | "amber" | "red" | "violet" | "slate";
};

export type SourceDistributionItem = {
  label: string;
  count: number;
};

export type ScenarioOverview = {
  id: string;
  title: string;
  description: string;
  claimsCount: number;
  sourcesCount: number;
  graphNodesCount: number;
  graphEdgesCount: number;
  gapsCount: number;
  contradictionsCount: number;
};

export type DashboardStats = {
  metrics: DashboardMetric[];
  recentClaims: EvidenceClaim[];
  sourceTypeDistribution: SourceDistributionItem[];
  sourceReliabilityDistribution: SourceDistributionItem[];
  importantSources: SourceMetadata[];
  highPriorityGaps: KnowledgeGap[];
  possibleContradictions: Contradiction[];
  scenarioOverviews: ScenarioOverview[];
};

const confidenceScore: Record<EvidenceClaim["confidence"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const sourceTypeLabel: Record<SourceType, string> = {
  scientific_article: "Scientific articles",
  internal_report: "Internal reports",
  patent: "Patents",
  experiment_protocol: "Experiment protocols",
  technical_standard: "Technical standards",
  reference_book: "Reference books",
};

function getAllClaims(results: SearchResult[]): EvidenceClaim[] {
  return results.flatMap((result) => result.evidence);
}

function getSourceReferencesCount(claims: EvidenceClaim[]): number {
  return new Set(claims.map((claim) => `${claim.sourceRef.sourceId}:${claim.sourceRef.chunkId}`))
    .size;
}

function getAverageConfidence(claims: EvidenceClaim[]): string {
  if (claims.length === 0) {
    return "0%";
  }

  const totalScore = claims.reduce((sum, claim) => sum + confidenceScore[claim.confidence], 0);
  const maxScore = claims.length * confidenceScore.high;
  return `${Math.round((totalScore / maxScore) * 100)}%`;
}

function getGraphRelationsCount(results: SearchResult[]): number {
  return results.reduce((sum, result) => sum + result.graph.edges.length, 0);
}

function createDistribution<T extends string>(
  items: T[],
  getLabel: (item: T) => string,
): SourceDistributionItem[] {
  const counts = items.reduce<Record<string, number>>((accumulator, item) => {
    const label = getLabel(item);
    return {
      ...accumulator,
      [label]: (accumulator[label] ?? 0) + 1,
    };
  }, {});

  return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

function getRecentClaims(claims: EvidenceClaim[]): EvidenceClaim[] {
  return [...claims]
    .sort((firstClaim, secondClaim) => secondClaim.year - firstClaim.year)
    .slice(0, 6);
}

function getHighPriorityGaps(gaps: KnowledgeGap[]): KnowledgeGap[] {
  const severityWeight: Record<KnowledgeGap["severity"], number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...gaps].sort(
    (firstGap, secondGap) =>
      severityWeight[secondGap.severity] - severityWeight[firstGap.severity],
  );
}

function getImportantSources(sources: SourceMetadata[]): SourceMetadata[] {
  return [...sources]
    .sort((firstSource, secondSource) => secondSource.year - firstSource.year)
    .slice(0, 4);
}

function getScenarioOverview(
  scenario: DemoScenario,
  results: SearchResult[],
): ScenarioOverview {
  const result = results.find((searchResult) => searchResult.id === scenario.searchResultId);

  return {
    id: scenario.id,
    title: scenario.title,
    description: scenario.description,
    claimsCount: result?.evidence.length ?? 0,
    sourcesCount: result?.sources.length ?? 0,
    graphNodesCount: result?.graph.nodes.length ?? 0,
    graphEdgesCount: result?.graph.edges.length ?? 0,
    gapsCount: result?.gaps.length ?? 0,
    contradictionsCount: result?.contradictions.length ?? 0,
  };
}

export function buildDashboardStats(
  results: SearchResult[] = mockSearchResults,
  documents: Document[] = mockDocuments,
  sources: SourceMetadata[] = mockSources,
  contradictions: Contradiction[] = mockContradictions,
  gaps: KnowledgeGap[] = mockGaps,
): DashboardStats {
  const claims = getAllClaims(results);
  const sourceReferencesCount = getSourceReferencesCount(claims);

  return {
    metrics: [
      {
        label: "Indexed documents",
        value: String(documents.filter((document) => document.status === "indexed").length),
        description: "Научные статьи, отчеты, протоколы и внутренние материалы в корпусе.",
        tone: "cyan",
      },
      {
        label: "Extracted claims",
        value: String(claims.length),
        description: "Структурированные утверждения, извлеченные из выбранных сценариев.",
        tone: "green",
      },
      {
        label: "Source references",
        value: String(sourceReferencesCount),
        description: "Уникальные ссылки на страницы и chunks, поддерживающие claims.",
        tone: "violet",
      },
      {
        label: "Graph relations",
        value: String(getGraphRelationsCount(results)),
        description: "Связи между материалами, процессами, условиями, эффектами и источниками.",
        tone: "cyan",
      },
      {
        label: "Contradictions",
        value: String(contradictions.length),
        description: "Конфликтующие claims, требующие экспертной проверки.",
        tone: contradictions.length > 0 ? "red" : "green",
      },
      {
        label: "Knowledge gaps",
        value: String(gaps.length),
        description: "Недостающие данные и слабые зоны доказательной базы.",
        tone: gaps.length > 0 ? "amber" : "green",
      },
      {
        label: "Average confidence",
        value: getAverageConfidence(claims),
        description: "Средняя нормированная уверенность по claims в mock-корпусе.",
        tone: "green",
      },
    ],
    recentClaims: getRecentClaims(claims),
    sourceTypeDistribution: createDistribution(
      sources.map((source) => source.sourceType),
      (sourceType) => sourceTypeLabel[sourceType],
    ),
    sourceReliabilityDistribution: createDistribution(
      sources.map((source) => source.reliability),
      (reliability) => reliability,
    ),
    importantSources: getImportantSources(sources),
    highPriorityGaps: getHighPriorityGaps(gaps),
    possibleContradictions: contradictions,
    scenarioOverviews: demoScenarios.map((scenario) => getScenarioOverview(scenario, results)),
  };
}
