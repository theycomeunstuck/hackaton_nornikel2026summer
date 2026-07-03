import type { ConfidenceLevel, SourceRef } from "../source/types";
import type { SearchResult } from "../../shared/types/search";

export type ExportFormat = "markdown" | "json" | "pdf";

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

export interface ExportOptions {
  includeEvidenceTable: boolean;
  includeSources: boolean;
  includeContradictions: boolean;
  includeGaps: boolean;
  includeGraphSummary: boolean;
}

export interface FrontendReportMetadata {
  productName: "Научный клубок";
  query: string;
  scenarioTitle?: string;
  generatedAt: string;
  generatedBy: "frontend";
}

export interface ExportReportRequest {
  format: ExportFormat;
  metadata: FrontendReportMetadata;
  result: SearchResult;
  options: ExportOptions;
}

export interface ExportReportResponse {
  reportId: string;
  format: ExportFormat;
  filename: string;
  contentType: string;
  downloadUrl?: string;
  generatedAt: string;
  status: "ready" | "pending" | "unsupported";
}
