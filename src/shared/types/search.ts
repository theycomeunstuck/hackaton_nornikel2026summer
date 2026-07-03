import type { EvidenceClaim } from "../../entities/claim/types";
import type { Contradiction } from "../../entities/contradiction/types";
import type { KnowledgeGap } from "../../entities/gap/types";
import type { KnowledgeGraph } from "../../entities/graph/types";
import type { ParsedQuery } from "../../entities/query/types";
import type { ConfidenceLevel, SourceMetadata } from "../../entities/source/types";

export interface AnswerSummary {
  shortConclusion: string;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  keyFindings: string[];
  limitations: string[];
}

export interface SearchResult {
  id: string;
  scenarioId: string;
  title: string;
  parsedQuery: ParsedQuery;
  answer: AnswerSummary;
  evidence: EvidenceClaim[];
  graph: KnowledgeGraph;
  contradictions: Contradiction[];
  gaps: KnowledgeGap[];
  sources: SourceMetadata[];
  generatedAt: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  defaultQuery: string;
  searchResultId: string;
  tags: string[];
}
