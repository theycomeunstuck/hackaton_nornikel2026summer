import type { ConfidenceLevel, SourceRef } from "../source/types";

export type ConditionKind =
  | "concentration"
  | "temperature"
  | "ph"
  | "flow_velocity"
  | "flow_rate"
  | "pressure"
  | "dry_residue"
  | "time"
  | "ratio"
  | "composition"
  | "equipment_setting";

export type ComparisonOperator =
  | "equals"
  | "less_than"
  | "less_than_or_equal"
  | "greater_than"
  | "greater_than_or_equal"
  | "range"
  | "approximately";

export interface Condition {
  id: string;
  kind: ConditionKind;
  parameter: string;
  operator: ComparisonOperator;
  value?: number;
  minValue?: number;
  maxValue?: number;
  unit: string;
  material?: string;
  note?: string;
}

export type EffectDirection = "increase" | "decrease" | "stabilize" | "enable" | "risk";

export interface Effect {
  id: string;
  target: string;
  direction: EffectDirection;
  description: string;
  magnitude?: string;
}

export type EvidenceClaimType =
  | "technology_selection"
  | "parameter_range"
  | "process_effect"
  | "material_behavior"
  | "equipment_requirement"
  | "source_limitation";

export interface EvidenceClaim {
  id: string;
  scenarioId: string;
  claimType: EvidenceClaimType;
  statement: string;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  sourceRef: SourceRef;
  conditions: Condition[];
  effects: Effect[];
  materials: string[];
  processes: string[];
  equipment: string[];
  year: number;
}
