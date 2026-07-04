import { useEffect, useMemo, useState } from "react";
import {
  getDocumentExtraction,
  getDocumentStatus,
  uploadDocument,
  type ExtractionResultResponse,
  type ProcessingStatusResponse,
  type ProcessingStep,
  type UploadResponse,
} from "../../shared/api/appApi";
import { ContentContainer } from "../../shared/ui/ContentContainer";
import { EvidencePageHeader } from "../../shared/ui/EvidencePageHeader";
import { FileDropzone, type SelectedUploadFile } from "../../shared/ui/FileDropzone";
import { MetricCard } from "../../shared/ui/MetricCard";
import { SectionCard } from "../../shared/ui/SectionCard";
import { StatusBadge, type StatusTone } from "../../shared/ui/StatusBadge";

type DisplayExtractionResult = {
  materials: string[];
  processes: string[];
  equipment: string[];
  properties: string[];
  parameters: string[];
  conclusions: string[];
  relations: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
  }>;
};

function TagGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-ice-100 bg-ice-50 px-2.5 py-1 text-xs font-medium text-ice-600"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">Не найдено</span>
        )}
      </div>
    </div>
  );
}

function getStatusTone(status: string | undefined): StatusTone {
  if (status === "processed" || status === "done") {
    return "success";
  }

  if (status === "failed") {
    return "danger";
  }

  if (status === "uploaded" || status === "processing" || status === "running") {
    return "info";
  }

  return "neutral";
}

function createFallbackSteps(status?: string): ProcessingStep[] {
  const isUploaded = status === "uploaded" || status === "processing" || status === "processed";
  const isProcessed = status === "processed";
  const isRunning = status === "processing" || status === "uploaded";

  return [
    {
      id: "file_uploaded",
      title: "Файл загружен",
      status: isUploaded ? "done" : "pending",
      description: "Документ принят backend и поставлен в обработку.",
    },
    {
      id: "text_extracted",
      title: "Текст извлекается",
      status: isProcessed ? "done" : isRunning ? "running" : "pending",
      description: "Backend извлекает текст, чанки и ссылочные фрагменты.",
    },
    {
      id: "entities_extracted",
      title: "Сущности и параметры выделяются",
      status: isProcessed ? "done" : isRunning ? "running" : "pending",
      description: "Выделяются материалы, процессы, оборудование, свойства и параметры.",
    },
    {
      id: "evidence_index_updated",
      title: "Индекс доказательств обновлён",
      status: isProcessed ? "done" : "pending",
      description: "После завершения доступны выводы и связи графа.",
    },
  ];
}

function ProcessingStatusPanel({
  uploadResponse,
  status,
}: {
  uploadResponse: UploadResponse | null;
  status: ProcessingStatusResponse | null;
}) {
  const currentStatus = status?.status ?? uploadResponse?.status;
  const steps = status?.steps?.length ? status.steps : createFallbackSteps(currentStatus);
  const progress =
    status?.progress ??
    Math.round((steps.filter((step) => step.status === "done").length / steps.length) * 100);

  return (
    <div className="rounded-2xl border border-white/75 bg-white/72 p-5 shadow-glass backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
            Конвейер обработки
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            От документа к индексу доказательств
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Статус запрашивается у backend каждые 1.5 секунды до завершения обработки.
          </p>
        </div>
        <StatusBadge label={currentStatus ?? "empty"} tone={getStatusTone(currentStatus)} />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Прогресс</span>
          <span className="text-slate-500">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-ice-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="grid grid-cols-[42px_minmax(0,1fr)_120px] items-center gap-4 rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-graphite-900 text-xs font-semibold text-white">
              {index + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">{step.title}</p>
              {step.description ? (
                <p className="mt-1 text-xs leading-5 text-slate-600">{step.description}</p>
              ) : null}
            </div>
            <div className="flex justify-end">
              <StatusBadge label={step.status} tone={getStatusTone(step.status)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function adaptExtraction(extraction: ExtractionResultResponse): DisplayExtractionResult {
  return {
    materials: extraction.entities?.materials ?? [],
    processes: extraction.entities?.processes ?? [],
    equipment: extraction.entities?.equipment ?? [],
    properties: extraction.entities?.properties ?? [],
    parameters: extraction.parameters ?? [],
    conclusions: extraction.conclusions ?? [],
    relations:
      extraction.relations?.map((relation, index) => ({
        id: relation.id ?? `relation-${index}`,
        source: relation.source ?? "source",
        target: relation.target ?? "target",
        label: relation.label ?? relation.relation ?? "relation",
      })) ?? [],
  };
}

function ExtractedObjectsPanel({ extraction }: { extraction: DisplayExtractionResult }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Извлечённые объекты" eyebrow="Результат обработки">
        <div className="grid grid-cols-4 gap-5">
          <TagGroup title="Материалы" items={extraction.materials} />
          <TagGroup title="Процессы" items={extraction.processes} />
          <TagGroup title="Оборудование" items={extraction.equipment} />
          <TagGroup title="Свойства" items={extraction.properties} />
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Параметры
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {extraction.parameters.length > 0 ? (
              extraction.parameters.map((parameter) => (
                <div key={parameter} className="rounded-xl border border-white bg-white p-3 text-sm text-slate-700">
                  {parameter}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-white bg-white p-3 text-sm text-slate-500">
                Параметры пока не найдены.
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Выводы" eyebrow="Conclusions">
        <div className="space-y-3">
          {extraction.conclusions.length > 0 ? (
            extraction.conclusions.map((conclusion) => (
              <article key={conclusion} className="rounded-xl border border-slate-200 bg-white/86 p-4 shadow-sm">
                <p className="text-sm leading-6 text-slate-900">{conclusion}</p>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Выводы пока не извлечены.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Связи графа" eyebrow="Relations">
        <div className="grid grid-cols-2 gap-3">
          {extraction.relations.length > 0 ? (
            extraction.relations.map((relation) => (
              <div key={relation.id} className="rounded-xl border border-slate-200 bg-white/86 p-3">
                <div className="grid grid-cols-[1fr_120px_1fr] items-center gap-3 text-xs">
                  <span className="truncate text-slate-600">{relation.source}</span>
                  <span className="rounded-full border border-ice-100 bg-ice-50 px-2 py-1 text-center font-semibold text-ice-600">
                    {relation.label}
                  </span>
                  <span className="truncate text-right text-slate-600">{relation.target}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Связи пока не построены.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function UploadHeaderAside() {
  return (
    <div className="rounded-xl border border-ice-100 bg-ice-50/75 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
        Индекс доказательств
      </p>
      <p className="mt-3 text-lg font-semibold text-slate-950">
        Новый документ добавляет проверяемые утверждения, источники и связи в граф.
      </p>
    </div>
  );
}

export function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<SelectedUploadFile | null>(null);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusResponse | null>(null);
  const [extraction, setExtraction] = useState<DisplayExtractionResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const summaryMetrics = useMemo(() => {
    const data = extraction;
    const entitiesCount = data
      ? data.materials.length + data.processes.length + data.equipment.length + data.properties.length
      : 0;

    return [
      {
        label: "Выводы",
        value: String(data?.conclusions.length ?? 0),
        description: "Извлечённые заключения и проверяемые выводы.",
        tone: "green" as const,
      },
      {
        label: "Сущности",
        value: String(entitiesCount),
        description: "Материалы, процессы, оборудование и свойства.",
        tone: "violet" as const,
      },
      {
        label: "Параметры",
        value: String(data?.parameters.length ?? 0),
        description: "Структурированные параметры и числовые условия.",
        tone: "amber" as const,
      },
      {
        label: "Связи графа",
        value: String(data?.relations.length ?? 0),
        description: "Связи, построенные по результатам обработки.",
        tone: "cyan" as const,
      },
    ];
  }, [extraction]);

  useEffect(() => {
    if (!uploadResponse?.documentId || processingStatus?.status === "processed" || processingStatus?.status === "failed") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      getDocumentStatus(uploadResponse.documentId)
        .then((status) => {
          setProcessingStatus(status);

          if (status.status === "failed") {
            setUploadError(status.error ?? "Backend сообщил об ошибке обработки документа.");
          }
        })
        .catch(() => {
          setUploadError("Не удалось получить статус обработки документа.");
        });
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [processingStatus?.status, uploadResponse?.documentId]);

  useEffect(() => {
    if (!uploadResponse?.documentId || processingStatus?.status !== "processed" || extraction) {
      return;
    }

    getDocumentExtraction(uploadResponse.documentId)
      .then((result) => {
        setExtraction(adaptExtraction(result));
      })
      .catch(() => {
        setUploadError("Документ обработан, но extraction не удалось загрузить.");
      });
  }, [extraction, processingStatus?.status, uploadResponse?.documentId]);

  const handleFileSelect = (file: SelectedUploadFile) => {
    setSelectedFile(file);
    setUploadResponse(null);
    setProcessingStatus(null);
    setExtraction(null);
    setUploadError(null);
    setIsUploading(true);

    uploadDocument(file.file, file.name)
      .then((response) => {
        setUploadResponse(response);
        setProcessingStatus({
          documentId: response.documentId,
          title: response.title ?? file.name,
          status: response.status,
          progress: response.status === "processed" ? 100 : 10,
        });
      })
      .catch(() => {
        setUploadError("Backend недоступен: файл не удалось отправить на /api/documents/upload.");
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  return (
    <ContentContainer>
      <EvidencePageHeader
        eyebrow="Загрузка документов"
        title="Загрузка документа в индекс доказательств"
        description="Документ отправляется в backend, проходит обработку, затем возвращает сущности, параметры, выводы и связи графа."
        aside={<UploadHeaderAside />}
      />

      <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(520px,1.05fr)] gap-6">
        <div className="space-y-6">
          <FileDropzone selectedFile={selectedFile} onFileSelect={handleFileSelect} />
          <ProcessingStatusPanel uploadResponse={uploadResponse} status={processingStatus} />
        </div>

        <div className="space-y-6">
          <SectionCard title="Состояние обработки" eyebrow="Статус документа">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Выбранный файл
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {selectedFile?.name ?? "Файл не выбран"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Статус документа
                </p>
                <div className="mt-2">
                  <StatusBadge
                    label={processingStatus?.status ?? uploadResponse?.status ?? (isUploading ? "uploading" : "empty")}
                    tone={getStatusTone(processingStatus?.status ?? uploadResponse?.status)}
                  />
                </div>
              </div>
            </div>

            {uploadResponse ? (
              <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-ice-100 bg-ice-50 p-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Document ID
                  </p>
                  <p className="mt-1 break-all font-semibold text-slate-900">{uploadResponse.documentId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Title
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {uploadResponse.title ?? selectedFile?.name ?? "не указан"}
                  </p>
                </div>
              </div>
            ) : null}

            {uploadError ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {uploadError}
              </p>
            ) : null}

            {!selectedFile ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                Выберите файл, чтобы отправить документ на backend-обработку.
              </p>
            ) : null}
          </SectionCard>

          {extraction ? (
            <SectionCard title="Индекс доказательств обновлён" eyebrow="Итог обработки">
              <p className="text-sm leading-6 text-slate-700">
                Документ обработан: сущности, параметры, выводы и связи доступны для проверки.
              </p>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {summaryMetrics.map((metric) => (
                  <MetricCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    description={metric.description}
                    tone={metric.tone}
                  />
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>

      {extraction ? (
        <ExtractedObjectsPanel extraction={extraction} />
      ) : (
        <SectionCard title="Извлечённые объекты" eyebrow="Ожидание обработки">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            После завершения обработки здесь появятся материалы, процессы, оборудование,
            свойства, параметры, выводы и связи графа.
          </div>
        </SectionCard>
      )}
    </ContentContainer>
  );
}
