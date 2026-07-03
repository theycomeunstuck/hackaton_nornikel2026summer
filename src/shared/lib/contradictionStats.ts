import type { EvidenceClaim } from "../../entities/claim/types";
import type { Contradiction } from "../../entities/contradiction/types";
import type { KnowledgeGap } from "../../entities/gap/types";
import type { SourceType } from "../../entities/source/types";
import { mockContradictions } from "../mock/contradictions.mock";
import { mockGaps } from "../mock/gaps.mock";
import { mockSearchResults } from "../mock/searchResults.mock";
import type { SearchResult } from "../types/search";

export type ContradictionSeverityFilter = "all" | Contradiction["severity"];

export type ContradictionFilters = {
  severity: ContradictionSeverityFilter;
  topic: string;
  sourceType: "all" | SourceType;
  search: string;
};

export type ContradictionListItem = {
  contradiction: Contradiction;
  claimA?: EvidenceClaim;
  claimB?: EvidenceClaim;
  topic: string;
  materials: string[];
  processes: string[];
  sourceTypes: SourceType[];
};

export type ContradictionStats = {
  total: number;
  severityCounts: Record<Contradiction["severity"], number>;
  relatedGapsCount: number;
  claimsNeedingReviewCount: number;
  items: ContradictionListItem[];
  gaps: KnowledgeGap[];
};

const emptySeverityCounts: Record<Contradiction["severity"], number> = {
  minor: 0,
  moderate: 0,
  critical: 0,
};

function getClaims(results: SearchResult[]): EvidenceClaim[] {
  return results.flatMap((result) => result.evidence);
}

function getTopic(item: Contradiction, claims: EvidenceClaim[]): string {
  const relatedClaim = claims.find((claim) => item.claimIds.includes(claim.id));
  return relatedClaim?.processes[0] ?? relatedClaim?.materials[0] ?? item.scenarioId;
}

function getContradictionItems(
  contradictions: Contradiction[],
  claims: EvidenceClaim[],
): ContradictionListItem[] {
  return contradictions.map((contradiction) => {
    const relatedClaims = contradiction.claimIds
      .map((claimId) => claims.find((claim) => claim.id === claimId))
      .filter((claim): claim is EvidenceClaim => Boolean(claim));
    const materials = Array.from(new Set(relatedClaims.flatMap((claim) => claim.materials)));
    const processes = Array.from(new Set(relatedClaims.flatMap((claim) => claim.processes)));
    const sourceTypes = Array.from(
      new Set(contradiction.sourceRefs.map((sourceRef) => sourceRef.sourceType)),
    );

    return {
      contradiction,
      claimA: relatedClaims[0],
      claimB: relatedClaims[1],
      topic: getTopic(contradiction, claims),
      materials,
      processes,
      sourceTypes,
    };
  });
}

export function buildContradictionStats(
  contradictions: Contradiction[] = mockContradictions,
  gaps: KnowledgeGap[] = mockGaps,
  results: SearchResult[] = mockSearchResults,
): ContradictionStats {
  const claims = getClaims(results);
  const severityCounts = contradictions.reduce<Record<Contradiction["severity"], number>>(
    (accumulator, contradiction) => ({
      ...accumulator,
      [contradiction.severity]: accumulator[contradiction.severity] + 1,
    }),
    emptySeverityCounts,
  );
  const claimsNeedingReviewCount = new Set(
    contradictions.flatMap((contradiction) => contradiction.claimIds),
  ).size;

  return {
    total: contradictions.length,
    severityCounts,
    relatedGapsCount: gaps.length,
    claimsNeedingReviewCount,
    items: getContradictionItems(contradictions, claims),
    gaps,
  };
}

export function filterContradictionItems(
  items: ContradictionListItem[],
  filters: ContradictionFilters,
): ContradictionListItem[] {
  const normalizedSearch = filters.search.trim().toLowerCase();
  const normalizedTopic = filters.topic.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSeverity =
      filters.severity === "all" || item.contradiction.severity === filters.severity;
    const matchesTopic =
      normalizedTopic.length === 0 ||
      [...item.materials, ...item.processes, item.topic]
        .join(" ")
        .toLowerCase()
        .includes(normalizedTopic);
    const matchesSourceType =
      filters.sourceType === "all" || item.sourceTypes.includes(filters.sourceType);
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [
        item.contradiction.title,
        item.contradiction.description,
        item.contradiction.resolutionHint,
        item.claimA?.statement ?? "",
        item.claimB?.statement ?? "",
        item.contradiction.sourceRefs.map((sourceRef) => sourceRef.documentTitle).join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesSeverity && matchesTopic && matchesSourceType && matchesSearch;
  });
}
