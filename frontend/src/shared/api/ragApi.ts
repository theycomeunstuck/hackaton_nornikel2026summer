import {
  getAppStats,
  getDemoScenario,
  getHealth,
  getScenarios,
  queryEvidence,
  requestJson,
  type AppStatsResponse,
  type HealthResponse,
  type QueryEvidenceOptions,
} from "./appApi";
import type { SearchResult } from "../types/rag";

export type RagHealthResponse = HealthResponse;
export type RagStatsResponse = AppStatsResponse;
export type { HealthResponse };

export { getDemoScenario, getHealth, getScenarios, queryEvidence, requestJson };

export async function getRagHealth(): Promise<RagHealthResponse> {
  return getHealth();
}

export async function getRagStats(): Promise<RagStatsResponse> {
  return getAppStats();
}

export async function searchEvidence(
  query: string,
  options: QueryEvidenceOptions = {},
): Promise<SearchResult> {
  return queryEvidence(query, options);
}
