import type { Condition, Effect, EvidenceClaim } from "../../entities/claim/types";
import type { Contradiction } from "../../entities/contradiction/types";
import type { KnowledgeGap } from "../../entities/gap/types";
import type { GraphEdge } from "../../entities/graph/types";
import type { ConfidenceLevel, SourceMetadata, SourceType } from "../../entities/source/types";
import { mockContradictions } from "../mock/contradictions.mock";
import { demoScenarios } from "../mock/demoScenarios.mock";
import { mockGaps } from "../mock/gaps.mock";
import { mockSearchResults } from "../mock/searchResults.mock";
import type { SearchResult } from "../types/search";

export type ClaimStatus =
  | "confirmed"
  | "weakly_supported"
  | "conflicting"
  | "new"
  | "needs_review";

export type ClaimFilters = {
  scenarioId: "all" | string;
  status: "all" | ClaimStatus;
  confidence: "all" | ConfidenceLevel;
  material: string;
  process: string;
  sourceType: "all" | SourceType;
  search: string;
};

export type ClaimMemoryItem = {
  claim: EvidenceClaim;
  scenarioTitle: string;
  status: ClaimStatus;
  supportingSourcesCount: number;
  relatedSource?: SourceMetadata;
  relatedContradictions: Contradiction[];
  relatedGaps: KnowledgeGap[];
  relatedGraphRelations: GraphEdge[];
  relatedConditions: Condition[];
  relatedEffects: Effect[];
};

export type ClaimMetric = {
  label: string;
  value: string;
  tone: "cyan" | "green" | "amber" | "red" | "violet" | "slate";
  description: string;
};

export type ClaimStats = {
  items: ClaimMemoryItem[];
  metrics: ClaimMetric[];
  availableScenarios: Array<{ id: string; title: string }>;
  availableSourceTypes: SourceType[];
  availableMaterials: string[];
  availableProcesses: string[];
};

const confidenceScore: Record<ConfidenceLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function getScenarioTitle(scenarioId: string): string {
  return demoScenarios.find((scenario) => scenario.id === scenarioId)?.title ?? scenarioId;
}

function getClaimStatus(
  claim: EvidenceClaim,
  relatedContradictions: Contradiction[],
  relatedGaps: KnowledgeGap[],
): ClaimStatus {
  if (relatedContradictions.length > 0) {
    return claim.confidence === "high" ? "conflicting" : "needs_review";
  }

  if (relatedGaps.length > 0) {
    return "needs_review";
  }

  if (claim.confidence === "high") {
    return "confirmed";
  }

  if (claim.confidence === "medium" || claim.confidence === "low") {
    return "weakly_supported";
  }

  return "new";
}

function getAllClaims(results: SearchResult[]): EvidenceClaim[] {
  return results.flatMap((result) => result.evidence);
}

function getGraphRelationsForClaim(results: SearchResult[], claimId: string): GraphEdge[] {
  return results
    .flatMap((result) => result.graph.edges)
    .filter((edge) => edge.source === claimId || edge.target === claimId);
}

function getRelatedGaps(claim: EvidenceClaim, gaps: KnowledgeGap[]): KnowledgeGap[] {
  return gaps.filter((gap) => {
    const sameScenario = gap.scenarioId === claim.scenarioId;
    const materialOverlap = gap.affectedMaterials.some((material) =>
      claim.materials.includes(material),
    );
    const processOverlap = gap.affectedProcesses.some((process) =>
      claim.processes.includes(process),
    );

    return sameScenario && (materialOverlap || processOverlap);
  });
}

function getSupportingSourcesCount(claim: EvidenceClaim, claims: EvidenceClaim[]): number {
  return new Set(
    claims
      .filter((item) => item.id === claim.id || item.sourceRef.sourceId === claim.sourceRef.sourceId)
      .map((item) => item.sourceRef.sourceId),
  ).size;
}

function getAverageConfidence(claims: EvidenceClaim[]): string {
  if (claims.length === 0) {
    return "0%";
  }

  const total = claims.reduce((sum, claim) => sum + confidenceScore[claim.confidence], 0);
  return `${Math.round((total / (claims.length * confidenceScore.high)) * 100)}%`;
}

function buildClaimItems(
  results: SearchResult[],
  contradictions: Contradiction[],
  gaps: KnowledgeGap[],
): ClaimMemoryItem[] {
  const claims = getAllClaims(results);

  return claims.map((claim) => {
    const result = results.find((item) => item.scenarioId === claim.scenarioId);
    const relatedContradictions = contradictions.filter((contradiction) =>
      contradiction.claimIds.includes(claim.id),
    );
    const relatedGaps = getRelatedGaps(claim, gaps);
    const status = getClaimStatus(claim, relatedContradictions, relatedGaps);

    return {
      claim,
      scenarioTitle: getScenarioTitle(claim.scenarioId),
      status,
      supportingSourcesCount: getSupportingSourcesCount(claim, claims),
      relatedSource: result?.sources.find((source) => source.id === claim.sourceRef.sourceId),
      relatedContradictions,
      relatedGaps,
      relatedGraphRelations: getGraphRelationsForClaim(results, claim.id),
      relatedConditions: claim.conditions,
      relatedEffects: claim.effects,
    };
  });
}

export function buildClaimStats(
  results: SearchResult[] = mockSearchResults,
  contradictions: Contradiction[] = mockContradictions,
  gaps: KnowledgeGap[] = mockGaps,
): ClaimStats {
  const items = buildClaimItems(results, contradictions, gaps);
  const claims = items.map((item) => item.claim);
  const uniqueSources = new Set(claims.map((claim) => claim.sourceRef.sourceId));
  const uniqueMaterials = new Set(claims.flatMap((claim) => claim.materials));
  const uniqueProcesses = new Set(claims.flatMap((claim) => claim.processes));
  const statusCount = (status: ClaimStatus) =>
    items.filter((item) => item.status === status).length;

  return {
    items,
    metrics: [
      {
        label: "Всего утверждений",
        value: String(items.length),
        tone: "cyan",
        description: "Накопленные проверяемые утверждения из текущего корпуса.",
      },
      {
        label: "Подтверждено",
        value: String(statusCount("confirmed")),
        tone: "green",
        description: "Утверждения с высокой уверенностью без явных конфликтов или пробелов.",
      },
      {
        label: "Слабая поддержка",
        value: String(statusCount("weakly_supported")),
        tone: "amber",
        description: "Утверждения со средней или низкой уверенностью.",
      },
      {
        label: "Нужна проверка",
        value: String(statusCount("needs_review") + statusCount("conflicting")),
        tone: "red",
        description: "Утверждения, связанные с противоречием или пробелом.",
      },
      {
        label: "Уникальные источники",
        value: String(uniqueSources.size),
        tone: "violet",
        description: "Уникальные ссылки на источники в базе утверждений.",
      },
      {
        label: "Материалы",
        value: String(uniqueMaterials.size),
        tone: "cyan",
        description: "Уникальные материалы в утверждениях.",
      },
      {
        label: "Процессы",
        value: String(uniqueProcesses.size),
        tone: "slate",
        description: "Уникальные процессы в утверждениях.",
      },
      {
        label: "Средняя уверенность",
        value: getAverageConfidence(claims),
        tone: "green",
        description: "Нормированная уверенность по всем утверждениям.",
      },
    ],
    availableScenarios: demoScenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
    })),
    availableSourceTypes: Array.from(new Set(claims.map((claim) => claim.sourceRef.sourceType))),
    availableMaterials: Array.from(uniqueMaterials).sort(),
    availableProcesses: Array.from(uniqueProcesses).sort(),
  };
}

export function filterClaimItems(
  items: ClaimMemoryItem[],
  filters: ClaimFilters,
): ClaimMemoryItem[] {
  const normalizedSearch = filters.search.trim().toLowerCase();
  const normalizedMaterial = filters.material.trim().toLowerCase();
  const normalizedProcess = filters.process.trim().toLowerCase();

  return items.filter((item) => {
    const matchesScenario =
      filters.scenarioId === "all" || item.claim.scenarioId === filters.scenarioId;
    const matchesStatus = filters.status === "all" || item.status === filters.status;
    const matchesConfidence =
      filters.confidence === "all" || item.claim.confidence === filters.confidence;
    const matchesSourceType =
      filters.sourceType === "all" || item.claim.sourceRef.sourceType === filters.sourceType;
    const matchesMaterial =
      normalizedMaterial.length === 0 ||
      item.claim.materials.join(" ").toLowerCase().includes(normalizedMaterial);
    const matchesProcess =
      normalizedProcess.length === 0 ||
      item.claim.processes.join(" ").toLowerCase().includes(normalizedProcess);
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [
        item.claim.statement,
        item.scenarioTitle,
        item.claim.materials.join(" "),
        item.claim.processes.join(" "),
        item.claim.equipment.join(" "),
        item.claim.sourceRef.documentTitle,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

    return (
      matchesScenario &&
      matchesStatus &&
      matchesConfidence &&
      matchesSourceType &&
      matchesMaterial &&
      matchesProcess &&
      matchesSearch
    );
  });
}
