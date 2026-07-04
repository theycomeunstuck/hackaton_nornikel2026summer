import sampleCatholyte from "../mock/rag/sample_catholyte_server.json";
import sampleDesalination from "../mock/rag/sample_desalination_server.json";
import samplePgm from "../mock/rag/sample_pgm_server.json";
import type { DemoScenario, SearchResult } from "../types/rag";

export type RagHealthResponse = {
  status: "ok" | "mock" | "error";
  baseUrl: string;
  isMock: boolean;
};

export type RagStatsResponse = {
  scenarios: number;
  evidenceItems: number;
  sources: number;
  graphNodes: number;
  graphEdges: number;
  gaps: number;
  contradictions: number;
  isMock: boolean;
};

type SearchRequest = {
  query: string;
  topK: number;
};

type ImportMetaWithEnv = ImportMeta & {
  env?: Record<string, string | boolean | undefined>;
};

const fallbackBaseUrl = "http://127.0.0.1:8000";

const scenarioSamples: Record<DemoScenario, SearchResult> = {
  desalination: sampleDesalination as unknown as SearchResult,
  catholyte: sampleCatholyte as unknown as SearchResult,
  pgm: samplePgm as unknown as SearchResult,
};

function getBaseUrl(): string {
  const env = (import.meta as ImportMetaWithEnv).env;
  const envBaseUrl =
    typeof env?.VITE_API_BASE_URL === "string" && env.VITE_API_BASE_URL.trim().length > 0
      ? env.VITE_API_BASE_URL
      : env?.VITE_RAG_BASE_URL;
  const baseUrl =
    typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0
      ? envBaseUrl.trim()
      : fallbackBaseUrl;

  return baseUrl.replace(/\/$/, "");
}

async function requestJson<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`RAG request failed: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

function getMockStats(): RagStatsResponse {
  const samples = Object.values(scenarioSamples);

  return {
    scenarios: samples.length,
    evidenceItems: samples.reduce((total, sample) => total + sample.evidence.length, 0),
    sources: samples.reduce((total, sample) => total + sample.sources.length, 0),
    graphNodes: samples.reduce((total, sample) => total + sample.graph.nodes.length, 0),
    graphEdges: samples.reduce((total, sample) => total + sample.graph.edges.length, 0),
    gaps: samples.reduce((total, sample) => total + sample.gaps.length, 0),
    contradictions: samples.reduce(
      (total, sample) => total + sample.contradictions.length,
      0,
    ),
    isMock: true,
  };
}

function matchesToken(query: string, token: string): boolean {
  return new RegExp(`(^|[^a-zа-яё])${token}([^a-zа-яё]|$)`, "i").test(query);
}

function resolveScenarioFromQuery(query: string): DemoScenario {
  const normalizedQuery = query.toLowerCase();

  if (
    normalizedQuery.includes("water") ||
    normalizedQuery.includes("desalination") ||
    normalizedQuery.includes("сухой остаток") ||
    normalizedQuery.includes("обессоливание")
  ) {
    return "desalination";
  }

  if (
    normalizedQuery.includes("католит") ||
    normalizedQuery.includes("никель") ||
    normalizedQuery.includes("electrowinning") ||
    normalizedQuery.includes("электроэкстракция")
  ) {
    return "catholyte";
  }

  if (
    matchesToken(normalizedQuery, "au") ||
    matchesToken(normalizedQuery, "ag") ||
    normalizedQuery.includes("мпг") ||
    normalizedQuery.includes("pgm") ||
    normalizedQuery.includes("штейн") ||
    normalizedQuery.includes("шлак")
  ) {
    return "pgm";
  }

  return "catholyte";
}

export async function getRagHealth(): Promise<RagHealthResponse> {
  try {
    return await requestJson<RagHealthResponse>("/api/health");
  } catch {
    return {
      status: "mock",
      baseUrl: getBaseUrl(),
      isMock: true,
    };
  }
}

export async function getRagStats(): Promise<RagStatsResponse> {
  try {
    return await requestJson<RagStatsResponse>("/api/stats");
  } catch {
    return getMockStats();
  }
}

export async function getDemoScenario(scenario: DemoScenario): Promise<SearchResult> {
  try {
    return await requestJson<SearchResult>(`/api/demo/${scenario}`);
  } catch {
    return scenarioSamples[scenario];
  }
}

export async function searchEvidence(query: string, topK = 10): Promise<SearchResult> {
  const requestBody: SearchRequest = { query, topK };

  try {
    return await requestJson<SearchResult>("/api/search", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  } catch {
    return scenarioSamples[resolveScenarioFromQuery(query)];
  }
}
