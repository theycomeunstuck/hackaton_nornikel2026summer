import type { ExportReportRequest, ExportReportResponse } from "./types";

export async function requestReportExport(
  request: ExportReportRequest,
): Promise<ExportReportResponse> {
  if (request.format === "pdf") {
    return {
      reportId: `future-pdf-${request.result.id}`,
      format: "pdf",
      filename: `${request.result.id}.pdf`,
      contentType: "application/pdf",
      generatedAt: request.metadata.generatedAt,
      status: "unsupported",
    };
  }

  return {
    reportId: `frontend-${request.format}-${request.result.id}`,
    format: request.format,
    filename: `${request.result.id}.${request.format === "markdown" ? "md" : "json"}`,
    contentType: request.format === "markdown" ? "text/markdown;charset=utf-8" : "application/json;charset=utf-8",
    generatedAt: request.metadata.generatedAt,
    status: "ready",
  };
}

export const reportExportEndpoint = "/api/reports/export";
