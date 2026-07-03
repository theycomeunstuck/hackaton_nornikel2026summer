import type { ConfidenceLevel, SourceRef } from "../source/types";

export type ContradictionSeverity = "minor" | "moderate" | "critical";

export interface Contradiction {
  id: string;
  scenarioId: string;
  title: string;
  description: string;
  severity: ContradictionSeverity;
  claimIds: string[];
  conflictingStatements: string[];
  sourceRefs: SourceRef[];
  confidence: ConfidenceLevel;
  resolutionHint: string;
}
