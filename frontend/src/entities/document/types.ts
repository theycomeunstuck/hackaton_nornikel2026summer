import type { SourceType } from "../source/types";

export type DocumentStatus = "indexed" | "processing" | "failed" | "draft";

export interface Document {
  id: string;
  title: string;
  sourceType: SourceType;
  year: number;
  authors: string[];
  organization?: string;
  status: DocumentStatus;
  indexedAt: string;
  pageCount: number;
  language: "ru" | "en";
  tags: string[];
}
