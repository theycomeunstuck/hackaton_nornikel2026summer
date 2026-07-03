import type {
  UploadExtractionResult,
  UploadProcessingStep,
} from "../../shared/mock/upload.mock";
import {
  mockUploadExtractionResult,
  uploadProcessingSteps,
} from "../../shared/mock/upload.mock";

export type UploadDocumentMockRequest = {
  fileName: string;
  fileType: string;
  fileSize: number;
};

export type UploadDocumentMockResponse = {
  documentId: string;
  title: string;
  fileName: string;
  fileType: string;
  status: "uploaded";
  uploadedAt: string;
};

export type ProcessingStatusMockResponse = {
  documentId: string;
  steps: UploadProcessingStep[];
};

export async function uploadDocumentMock(
  request: UploadDocumentMockRequest,
): Promise<UploadDocumentMockResponse> {
  return {
    documentId: `mock-document-${request.fileName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
    title: request.fileName,
    fileName: request.fileName,
    fileType: request.fileType,
    status: "uploaded",
    uploadedAt: new Date().toISOString(),
  };
}

export async function getProcessingStatusMock(
  documentId: string,
): Promise<ProcessingStatusMockResponse> {
  return {
    documentId,
    steps: uploadProcessingSteps,
  };
}

export async function getExtractionResultMock(
  _documentId: string,
): Promise<UploadExtractionResult> {
  return mockUploadExtractionResult;
}
