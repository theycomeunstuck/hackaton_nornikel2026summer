import type { ConfidenceLevel, SourceRef } from "../source/types";

export type GapSeverity = "low" | "medium" | "high";

export interface KnowledgeGap {
  id: string;
  scenarioId: string;
  title: string;
  description: string;
  severity: GapSeverity;
  affectedMaterials: string[];
  affectedProcesses: string[];
  missingEvidence: string;
  recommendedAction: string;
  confidence: ConfidenceLevel;
  relatedSourceRefs: SourceRef[];
}
