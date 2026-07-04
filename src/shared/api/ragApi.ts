import sampleCatholyte from "../mock/rag/sample_catholyte_server.json";
import sampleDesalination from "../mock/rag/sample_desalination_server.json";
import samplePgm from "../mock/rag/sample_pgm_server.json";
import { demoScenarios as localDemoScenarios } from "../mock/demoScenarios";
import type { DemoScenario as UiDemoScenario } from "../types/search";
import type {
  DemoScenario,
  QueryFilters,
  QueryRequest,
  SearchResult,
} from "../types/rag";

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

type SearchEvidenceOptions = {
  scenarioId?: string;
  filters?: QueryFilters;
};

type ImportMetaWithEnv = ImportMeta & {
  env?: Record<string, string | boolean | undefined>;
};

const fallbackBaseUrl = "http://127.0.0.1:8000";

type LocalScenarioId = "desalination" | "catholyte" | "pgm";

type UiDemoScenarioWithQuery = UiDemoScenario & {
  query: string;
};

const scenarioSamples: Record<LocalScenarioId, SearchResult> = {
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

function toBackendScenarioId(scenarioId: string): string {
  return scenarioId === "pgm" ? "metals" : scenarioId;
}

function toLocalScenarioId(scenarioId: string | undefined): LocalScenarioId | null {
  if (scenarioId === "desalination" || scenarioId === "catholyte" || scenarioId === "pgm") {
    return scenarioId;
  }

  if (scenarioId === "metals") {
    return "pgm";
  }

  return null;
}

function resolveScenarioFromQuery(query: string): LocalScenarioId {
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
    normalizedQuery.includes("metals") ||
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

function toUiDemoScenario(scenario: DemoScenario): UiDemoScenarioWithQuery {
  const localScenarioId = toLocalScenarioId(scenario.id);
  const localScenario = localDemoScenarios.find(
    (candidate) => candidate.id === localScenarioId,
  );

  return {
    id: scenario.id,
    title: scenario.title,
    description: localScenario?.description ?? scenario.query,
    defaultQuery: scenario.query,
    query: scenario.query,
    searchResultId: localScenario?.searchResultId ?? localScenarioId ?? scenario.id,
    tags: localScenario?.tags ?? [],
  };
}

function getFallbackScenarios(): UiDemoScenarioWithQuery[] {
  return localDemoScenarios.map((scenario) => ({
    ...scenario,
    query: scenario.query ?? scenario.defaultQuery,
  }));
}

export async function getScenarios(): Promise<UiDemoScenarioWithQuery[]> {
  try {
    const scenarios = await requestJson<DemoScenario[]>("/api/scenarios");
    return scenarios.map(toUiDemoScenario);
  } catch {
    return getFallbackScenarios();
  }
}

export async function searchEvidence(
  query: string,
  options: SearchEvidenceOptions = {},
): Promise<SearchResult> {
  const requestBody: QueryRequest = {
    query,
    scenarioId: options.scenarioId ? toBackendScenarioId(options.scenarioId) : undefined,
    filters: options.filters,
  };

  try {
    return await requestJson<SearchResult>("/api/query", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  } catch {
    const fallbackScenarioId =
      toLocalScenarioId(options.scenarioId) ?? resolveScenarioFromQuery(query);
    return scenarioSamples[fallbackScenarioId];
  }
}
