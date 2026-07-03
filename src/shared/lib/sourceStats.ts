import type { EvidenceClaim } from "../../entities/claim/types";
import type { Document } from "../../entities/document/types";
import type { ConfidenceLevel, SourceMetadata, SourceType } from "../../entities/source/types";
import { mockDocuments } from "../mock/documents.mock";
import { mockSearchResults } from "../mock/searchResults.mock";
import { mockSources } from "../mock/sources.mock";
import type { SearchResult } from "../types/search";

export type SourceFilters = {
  sourceType: "all" | SourceType;
  geography: "all" | "unknown";
  reliability: "all" | ConfidenceLevel;
  yearFrom: number;
  yearTo: number;
  search: string;
};

export type SourceReferenceSummary = {
  claimId: string;
  claimText: string;
  confidence: ConfidenceLevel;
  page: number;
  chunkId: string;
  year: number;
};

export type SourceListItem = {
  source: SourceMetadata;
  language: Document["language"] | "unknown";
  geography: "unknown";
  relatedClaimsCount: number;
  excerpt: string;
  references: SourceReferenceSummary[];
};

export type SourceSummaryMetric = {
  label: string;
  value: string;
  tone: "cyan" | "green" | "amber" | "red" | "violet" | "slate";
  description: string;
};

export type SourceStats = {
  metrics: SourceSummaryMetric[];
  typeDistribution: Array<{ label: string; count: number }>;
  reliabilityDistribution: Array<{ label: string; count: number }>;
  yearRange: {
    from: number;
    to: number;
  };
  items: SourceListItem[];
  availableSourceTypes: SourceType[];
};

const sourceTypeLabel: Record<SourceType, string> = {
  scientific_article: "Публикации",
  internal_report: "Отчеты",
  patent: "Патенты",
  experiment_protocol: "Эксперименты",
  technical_standard: "Стандарты",
  reference_book: "Справочники",
};

function getClaims(results: SearchResult[]): EvidenceClaim[] {
  return results.flatMap((result) => result.evidence);
}

function createDistribution<T extends string>(
  values: T[],
  getLabel: (value: T) => string,
): Array<{ label: string; count: number }> {
  const counts = values.reduce<Record<string, number>>((accumulator, value) => {
    const label = getLabel(value);
    return {
      ...accumulator,
      [label]: (accumulator[label] ?? 0) + 1,
    };
  }, {});

  return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

function getYearRange(sources: SourceMetadata[]): { from: number; to: number } {
  const years = sources.map((source) => source.year);
  return {
    from: Math.min(...years),
    to: Math.max(...years),
  };
}

function getSourceItems(
  sources: SourceMetadata[],
  documents: Document[],
  claims: EvidenceClaim[],
): SourceListItem[] {
  return sources.map((source) => {
    const document = documents.find((item) => item.id === source.documentId);
    const relatedClaims = claims.filter((claim) => claim.sourceRef.sourceId === source.id);
    const references = relatedClaims.map((claim) => ({
      claimId: claim.id,
      claimText: claim.statement,
      confidence: claim.confidence,
      page: claim.sourceRef.page,
      chunkId: claim.sourceRef.chunkId,
      year: claim.year,
    }));

    return {
      source,
      language: document?.language ?? "unknown",
      geography: "unknown",
      relatedClaimsCount: relatedClaims.length,
      excerpt: relatedClaims[0]?.statement ?? "Excerpt is not available in current mock data.",
      references,
    };
  });
}

export function buildSourceStats(
  sources: SourceMetadata[] = mockSources,
  documents: Document[] = mockDocuments,
  results: SearchResult[] = mockSearchResults,
): SourceStats {
  const claims = getClaims(results);
  const yearRange = getYearRange(sources);
  const typeDistribution = createDistribution(
    sources.map((source) => source.sourceType),
    (sourceType) => sourceTypeLabel[sourceType],
  );
  const reliabilityDistribution = createDistribution(
    sources.map((source) => source.reliability),
    (reliability) => reliability,
  );

  return {
    metrics: [
      {
        label: "Всего источников",
        value: String(sources.length),
        tone: "cyan",
        description: "Публикации, отчеты и протоколы, поддерживающие claims.",
      },
      ...typeDistribution.map((item) => ({
        label: item.label,
        value: String(item.count),
        tone: "slate" as const,
        description: "Распределение по типу источника.",
      })),
      {
        label: "High reliability",
        value: String(sources.filter((source) => source.reliability === "high").length),
        tone: "green",
        description: "Источники с высокой надежностью.",
      },
      {
        label: "Year range",
        value: `${yearRange.from}-${yearRange.to}`,
        tone: "violet",
        description: "Диапазон годов в текущем mock-корпусе.",
      },
    ],
    typeDistribution,
    reliabilityDistribution,
    yearRange,
    items: getSourceItems(sources, documents, claims),
    availableSourceTypes: Array.from(new Set(sources.map((source) => source.sourceType))),
  };
}

export function filterSourceItems(
  items: SourceListItem[],
  filters: SourceFilters,
): SourceListItem[] {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    const matchesType =
      filters.sourceType === "all" || item.source.sourceType === filters.sourceType;
    const matchesGeography =
      filters.geography === "all" || item.geography === filters.geography;
    const matchesReliability =
      filters.reliability === "all" || item.source.reliability === filters.reliability;
    const matchesYear =
      item.source.year >= filters.yearFrom && item.source.year <= filters.yearTo;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [
        item.source.title,
        item.source.authors.join(" "),
        item.source.organization ?? "",
        item.source.tags.join(" "),
        item.excerpt,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesType && matchesGeography && matchesReliability && matchesYear && matchesSearch;
  });
}

export function getSourceTypeLabel(sourceType: SourceType): string {
  return sourceTypeLabel[sourceType];
}
