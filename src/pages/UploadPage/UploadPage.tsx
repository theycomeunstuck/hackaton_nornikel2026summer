import { useMemo, useState } from "react";
import type { Condition } from "../../entities/claim/types";
import {
  getExtractionResultMock,
  uploadDocumentMock,
  type UploadDocumentMockResponse,
} from "../../entities/document/api";
import type { UploadExtractionResult } from "../../shared/mock/upload.mock";
import { mockUploadExtractionResult } from "../../shared/mock/upload.mock";
import { ConfidenceBadge } from "../../shared/ui/ConfidenceBadge";
import { FileDropzone, type SelectedUploadFile } from "../../shared/ui/FileDropzone";
import { MetricCard } from "../../shared/ui/MetricCard";
import { SectionCard } from "../../shared/ui/SectionCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";
import { ProcessingPipeline } from "../../widgets/ProcessingPipeline/ProcessingPipeline";

function formatCondition(condition: Condition): string {
  if (condition.operator === "range") {
    return `${condition.parameter}: ${condition.minValue}-${condition.maxValue} ${condition.unit}`;
  }

  if (condition.value !== undefined) {
    const operatorLabel: Record<Condition["operator"], string> = {
      equals: "=",
      less_than: "<",
      less_than_or_equal: "<=",
      greater_than: ">",
      greater_than_or_equal: ">=",
      range: "",
      approximately: "~",
    };

    return `${condition.parameter}: ${operatorLabel[condition.operator]} ${condition.value} ${condition.unit}`;
  }

  return condition.note ? `${condition.parameter}: ${condition.note}` : `${condition.parameter}: ${condition.unit}`;
}

function TagGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span key={item} className="rounded border border-ice-100 bg-ice-50 px-2.5 py-1 text-xs font-medium text-ice-600">
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

function ExtractedObjectsPanel({ extraction }: { extraction: UploadExtractionResult }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Извлеченные объекты" eyebrow="Результат обработки">
        <div className="grid grid-cols-3 gap-5">
          <TagGroup title="Материалы" items={extraction.materials} />
          <TagGroup title="Процессы" items={extraction.processes} />
          <TagGroup title="Оборудование" items={extraction.equipment} />
        </div>

        <div className="mt-6 rounded border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Параметры и числовые условия
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {extraction.conditions.map((condition) => (
              <div key={condition.id} className="rounded border border-white bg-white p-3 text-sm text-slate-700">
                {formatCondition(condition)}
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Утверждения и ссылки на источники" eyebrow="Доказательные объекты">
        <div className="space-y-3">
          {extraction.claims.map((claim) => (
            <article key={claim.id} className="rounded border border-slate-200 bg-white/86 p-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm leading-6 text-slate-900">{claim.statement}</p>
                <ConfidenceBadge confidence={claim.confidence} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-500">
                <div>
                  <span className="font-semibold uppercase tracking-[0.12em] text-slate-400">Документ</span>
                  <p className="mt-1 text-slate-700">{claim.sourceRef.documentTitle}</p>
                </div>
                <div>
                  <span className="font-semibold uppercase tracking-[0.12em] text-slate-400">Страница</span>
                  <p className="mt-1 text-slate-700">{claim.sourceRef.page}</p>
                </div>
                <div>
                  <span className="font-semibold uppercase tracking-[0.12em] text-slate-400">Фрагмент</span>
                  <p className="mt-1 text-slate-700">{claim.sourceRef.chunkId}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Связи графа" eyebrow="Граф утверждений">
        <div className="grid grid-cols-2 gap-3">
          {extraction.graphRelations.map((relation) => (
            <div key={relation.id} className="rounded border border-slate-200 bg-white/86 p-3">
              <div className="grid grid-cols-[1fr_120px_1fr] items-center gap-3 text-xs">
                <span className="truncate text-slate-600">{relation.source}</span>
                <span className="rounded border border-ice-100 bg-ice-50 px-2 py-1 text-center font-semibold text-ice-600">
                  {relation.label}
                </span>
                <span className="truncate text-right text-slate-600">{relation.target}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<SelectedUploadFile | null>(null);
  const [uploadResponse, setUploadResponse] = useState<UploadDocumentMockResponse | null>(null);
  const [extraction, setExtraction] = useState<UploadExtractionResult | null>(null);

  const summaryMetrics = useMemo(() => {
    const data = extraction ?? mockUploadExtractionResult;
    const entitiesCount = data.materials.length + data.processes.length + data.equipment.length;

    return [
      {
        label: "Добавлено утверждений",
        value: String(data.claims.length),
        description: "Новые утверждения подготовлены для таблицы доказательств.",
        tone: "green" as const,
      },
      {
        label: "Ссылки на источники",
        value: String(data.sourceRefs.length),
        description: "Созданы ссылки на документ, страницу и фрагмент.",
        tone: "cyan" as const,
      },
      {
        label: "Найдено сущностей",
        value: String(entitiesCount),
        description: "Материалы, процессы и оборудование.",
        tone: "violet" as const,
      },
      {
        label: "Связи графа",
        value: String(data.graphRelations.length),
        description: "Связи для графа утверждений.",
        tone: "cyan" as const,
      },
      {
        label: "Числовые условия",
        value: String(data.conditions.length),
        description: "Структурированные параметры и условия.",
        tone: "amber" as const,
      },
    ];
  }, [extraction]);

  const handleFileSelect = async (file: SelectedUploadFile) => {
    setSelectedFile(file);
    setExtraction(null);
    const response = await uploadDocumentMock({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    setUploadResponse(response);
  };

  const handleProcessingComplete = async () => {
    const documentId = uploadResponse?.documentId ?? "local-document";
    const result = await getExtractionResultMock(documentId);
    setExtraction(result);
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-6">
      <section className="rounded border border-white/75 bg-white/76 p-7 shadow-glass backdrop-blur-2xl">
        <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ice-600">
              Загрузка документов
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">
              Загрузка документа в индекс доказательств
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
              Процесс показывает, как документ проходит обработку: текст,
              фрагменты, утверждения, сущности, числовые условия, ссылки на источники
              и связи графа.
            </p>
          </div>
          <div className="rounded border border-ice-100 bg-graphite-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-300">
              Индекс доказательств
            </p>
            <p className="mt-3 text-lg font-semibold">
              Новый документ должен добавить проверяемые утверждения, источники и связи в граф.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(520px,1.05fr)] gap-6">
        <div className="space-y-6">
          <FileDropzone selectedFile={selectedFile} onFileSelect={handleFileSelect} />
          <ProcessingPipeline
            canStart={Boolean(selectedFile)}
            onComplete={handleProcessingComplete}
            onReset={() => setExtraction(null)}
          />
        </div>

        <div className="space-y-6">
          <SectionCard title="Состояние обработки" eyebrow="Статус документа">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Выбранный файл
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {selectedFile?.name ?? "Файл не выбран"}
                </p>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Статус документа
                </p>
                <div className="mt-2">
                  <StatusBadge
                    label={extraction ? "завершено" : uploadResponse ? "загружено" : "пусто"}
                    tone={extraction ? "success" : uploadResponse ? "info" : "neutral"}
                  />
                </div>
              </div>
            </div>
            {!selectedFile ? (
              <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                Выберите файл, чтобы запустить обработку документа.
              </p>
            ) : null}
          </SectionCard>

          {extraction ? (
            <SectionCard title="Индекс доказательств обновлен" eyebrow="Итог обработки">
              <p className="text-sm leading-6 text-slate-700">
                Индекс доказательств обновлен: новые утверждения, источники и связи добавлены в граф.
              </p>
              <div className="mt-4 grid grid-cols-5 gap-3">
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
        <SectionCard title="Извлеченные объекты" eyebrow="Ожидание обработки">
          <div className="rounded border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            После завершения обработки здесь появятся материалы, процессы, оборудование,
            числовые условия, утверждения, ссылки на источники и связи графа.
          </div>
        </SectionCard>
      )}
    </div>
  );
}
