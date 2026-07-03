import type { ConfidenceLevel, SourceRef } from "../source/types";

export type ExportFormat = "pdf" | "docx" | "xlsx";

export interface ReportSection {
  id: string;
  title: string;
  included: boolean;
}

export interface EvidenceReportDraft {
  id: string;
  searchResultId: string;
  title: string;
  format: ExportFormat;
  sections: ReportSection[];
  sourceRefs: SourceRef[];
  overallConfidence: ConfidenceLevel;
  createdAt: string;
}
