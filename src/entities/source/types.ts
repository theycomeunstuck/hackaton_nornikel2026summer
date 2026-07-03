export type ConfidenceLevel = "high" | "medium" | "low";

export type SourceType =
  | "scientific_article"
  | "internal_report"
  | "patent"
  | "experiment_protocol"
  | "technical_standard"
  | "reference_book";

export interface SourceRef {
  sourceId: string;
  documentTitle: string;
  sourceType: SourceType;
  year: number;
  page: number;
  chunkId: string;
  section?: string;
}

export interface SourceMetadata {
  id: string;
  title: string;
  sourceType: SourceType;
  year: number;
  authors: string[];
  organization?: string;
  documentId?: string;
  tags: string[];
  reliability: ConfidenceLevel;
}
