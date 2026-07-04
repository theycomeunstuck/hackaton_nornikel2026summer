import sampleCatholyte from "../mock/rag/sample_catholyte_server.json";
import sampleDesalination from "../mock/rag/sample_desalination_server.json";
import samplePgm from "../mock/rag/sample_pgm_server.json";
import { demoScenarios as localDemoScenarios } from "../mock/demoScenarios";
import type { DemoScenario as UiDemoScenario } from "../types/search";
import type {
  DemoScenario,
  Contradiction,
  KnowledgeGraph,
  KnowledgeGap,
  QueryFilters,
  QueryRequest,
  SearchResult,
  SourceRef,
} from "../types/rag";

export type HealthResponse = {
  status: string;
  service: string | null;
  version: string | null;
  engine: "rag" | "mock" | null;
  baseUrl: string;
  isOffline: boolean;
};

export type AppStatsResponse = {
  scenarios: number;
  evidenceItems: number;
  sources: number;
  graphNodes: number;
  graphEdges: number;
  gaps: number;
  contradictions: number;
  isMock: boolean;
};

export type DashboardCard = {
  label: string;
  value: string | number;
};

export type DashboardResponse = {
  mode?: "rag" | "mock" | string | null;
  cards: DashboardCard[];
  indexStats?: Record<string, unknown> | null;
  domainsCoverage?: Record<string, unknown>[] | null;
  priorityGaps?: Record<string, unknown>[] | null;
  recentClaims?: Record<string, unknown>[] | null;
};

export type SourceListItem = SourceRef & {
  id?: string | null;
  title?: string | null;
  authors?: string[] | null;
  reliability?: "high" | "medium" | "low" | "unknown" | string | null;
  excerpt?: string | null;
  tags?: string[] | null;
  language?: string | null;
  organization?: string | null;
};

export type SourceListParams = {
  geography?: string;
  type?: string;
  year_from?: number;
  year_to?: number;
};

export type QueryEvidenceOptions = {
  scenarioId?: string;
  filters?: QueryFilters;
};

export type UiDemoScenarioWithQuery = UiDemoScenario & {
  query: string;
};

type BackendHealthResponse = {
  status: string;
  service?: string | null;
  version?: string | null;
  engine?: "rag" | "mock" | null;
};

type ImportMetaWithEnv = ImportMeta & {
  env?: Record<string, string | boolean | undefined>;
};

type LocalScenarioId = "desalination" | "catholyte" | "pgm";

const fallbackBaseUrl = "http://127.0.0.1:8000";

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

export async function requestJson<TResponse>(
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
    throw new Error(`App API request failed: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

function getMockStats(): AppStatsResponse {
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
    normalizedQuery.includes("вода") ||
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

export async function getHealth(): Promise<HealthResponse> {
  try {
    const health = await requestJson<BackendHealthResponse>("/api/health");

    return {
      status: health.status,
      service: health.service ?? null,
      version: health.version ?? null,
      engine: health.engine ?? null,
      baseUrl: getBaseUrl(),
      isOffline: false,
    };
  } catch {
    return {
      status: "offline",
      service: null,
      version: null,
      engine: null,
      baseUrl: getBaseUrl(),
      isOffline: true,
    };
  }
}

export async function getScenarios(): Promise<UiDemoScenarioWithQuery[]> {
  try {
    const scenarios = await requestJson<DemoScenario[]>("/api/scenarios");
    return scenarios.map(toUiDemoScenario);
  } catch {
    return getFallbackScenarios();
  }
}

export async function getDashboard(): Promise<DashboardResponse> {
  return requestJson<DashboardResponse>("/api/dashboard");
}

export async function getGraph(topic?: string): Promise<KnowledgeGraph> {
  const trimmedTopic = topic?.trim();
  const queryString = trimmedTopic
    ? `?${new URLSearchParams({ topic: trimmedTopic }).toString()}`
    : "";

  try {
    return await requestJson<KnowledgeGraph>(`/api/graph${queryString}`);
  } catch {
    const fallbackScenarioId = trimmedTopic
      ? resolveScenarioFromQuery(trimmedTopic)
      : "desalination";
    return scenarioSamples[fallbackScenarioId].graph;
  }
}

function getFallbackSources(): SourceListItem[] {
  const sourceByKey = new Map<string, SourceListItem>();

  Object.values(scenarioSamples)
    .flatMap((sample) => sample.sources)
    .forEach((source) => {
      const key = [
        source.documentId,
        source.sourceName,
        source.chunkId,
        source.page,
      ].join(":");

      if (!sourceByKey.has(key)) {
        sourceByKey.set(key, source);
      }
    });

  return Array.from(sourceByKey.values());
}

export async function getSources(params: SourceListParams = {}): Promise<SourceListItem[]> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

  try {
    return await requestJson<SourceListItem[]>(`/api/sources${queryString}`);
  } catch {
    return getFallbackSources();
  }
}

export async function getContradictions(): Promise<Contradiction[]> {
  try {
    return await requestJson<Contradiction[]>("/api/contradictions");
  } catch {
    return Object.values(scenarioSamples).flatMap((sample) => sample.contradictions);
  }
}

export async function getGaps(): Promise<KnowledgeGap[]> {
  try {
    return await requestJson<KnowledgeGap[]>("/api/gaps");
  } catch {
    return Object.values(scenarioSamples).flatMap((sample) => sample.gaps);
  }
}

export async function queryEvidence(
  query: string,
  options: QueryEvidenceOptions = {},
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

export async function getAppStats(): Promise<AppStatsResponse> {
  try {
    return await requestJson<AppStatsResponse>("/api/stats");
  } catch {
    return getMockStats();
  }
}

export async function getDemoScenario(scenarioId: string): Promise<SearchResult> {
  const scenario = (await getScenarios()).find((candidate) => candidate.id === scenarioId);
  const localScenarioId = toLocalScenarioId(scenarioId);
  const fallbackQuery =
    scenario?.query ??
    localDemoScenarios.find((candidate) => candidate.id === localScenarioId)?.query ??
    "";

  return queryEvidence(fallbackQuery, { scenarioId });
}
