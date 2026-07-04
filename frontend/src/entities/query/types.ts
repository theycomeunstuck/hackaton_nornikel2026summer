import type { Condition } from "../claim/types";

export interface ParsedQuery {
  id: string;
  originalText: string;
  normalizedQuestion: string;
  domain: "water_treatment" | "nickel_electrowinning" | "matte_slag_partitioning";
  intent:
    | "technology_selection"
    | "parameter_optimization"
    | "evidence_review"
    | "gap_analysis"
    | "literature_review"
    | "experiments_lookup";
  materials: string[];
  processes: string[];
  equipment: string[];
  targetParameters: string[];
  numericConditions: Condition[];
  timeScope?: {
    fromYear: number;
    toYear: number;
  };
}
