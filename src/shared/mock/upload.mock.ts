import type { Condition, EvidenceClaim } from "../../entities/claim/types";
import type { GraphEdge } from "../../entities/graph/types";
import type { SourceRef } from "../../entities/source/types";
import { waterDesalinationResult } from "./searchResults.mock";

export type UploadProcessingStepId =
  | "file_uploaded"
  | "text_extracted"
  | "chunks_created"
  | "claims_extracted"
  | "entities_conditions_found"
  | "graph_relations_built"
  | "evidence_index_updated";

export type UploadProcessingStepStatus = "pending" | "running" | "done" | "failed";

export type UploadProcessingStep = {
  id: UploadProcessingStepId;
  title: string;
  description: string;
};

export type UploadExtractionResult = {
  materials: string[];
  processes: string[];
  equipment: string[];
  conditions: Condition[];
  claims: EvidenceClaim[];
  sourceRefs: SourceRef[];
  graphRelations: GraphEdge[];
};

export const uploadProcessingSteps: UploadProcessingStep[] = [
  {
    id: "file_uploaded",
    title: "Файл загружен",
    description: "Документ добавлен в локальную очередь обработки.",
  },
  {
    id: "text_extracted",
    title: "Текст извлечен",
    description: "Содержимое подготовлено для разбиения на научно-технические фрагменты.",
  },
  {
    id: "chunks_created",
    title: "Фрагменты сформированы",
    description: "Фрагменты привязаны к страницам и будущим ссылкам на источники.",
  },
  {
    id: "claims_extracted",
    title: "Утверждения извлечены",
    description: "Найдены утверждения, которые могут быть проверены источниками.",
  },
  {
    id: "entities_conditions_found",
    title: "Сущности и условия найдены",
    description: "Выделены материалы, процессы, оборудование и числовые условия.",
  },
  {
    id: "graph_relations_built",
    title: "Связи графа построены",
    description: "Утверждения связаны с источниками, условиями, эффектами и процессами.",
  },
  {
    id: "evidence_index_updated",
    title: "Индекс доказательств обновлен",
    description: "Новые утверждения, источники и связи готовы для поиска доказательств.",
  },
];

const uploadClaims = waterDesalinationResult.evidence.slice(0, 3);

export const mockUploadExtractionResult: UploadExtractionResult = {
  materials: Array.from(new Set(uploadClaims.flatMap((claim) => claim.materials))),
  processes: Array.from(new Set(uploadClaims.flatMap((claim) => claim.processes))),
  equipment: Array.from(new Set(uploadClaims.flatMap((claim) => claim.equipment))),
  conditions: uploadClaims.flatMap((claim) => claim.conditions),
  claims: uploadClaims,
  sourceRefs: uploadClaims.map((claim) => claim.sourceRef),
  graphRelations: waterDesalinationResult.graph.edges.slice(0, 5),
};
