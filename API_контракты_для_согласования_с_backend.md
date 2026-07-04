Auth
POST /api/auth/login

type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    role: 'researcher' | 'analyst' | 'manager' | 'admin';
    organization?: string;
  };
};
GET /api/auth/me

type MeResponse = {
  id: string;
  name: string;
  email: string;
  role: 'researcher' | 'analyst' | 'manager' | 'admin';
};
Documents Upload
POST /api/documents/upload

type UploadResponse = {
  documentId: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'csv' | 'xlsx';
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  uploadedAt: string;
};
Processing Status
GET /api/documents/:documentId/status

type ProcessingStatusResponse = {
  documentId: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  steps: {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'running' | 'done' | 'failed';
  }[];
};

Пример шагов:

[
  { name: 'Файл загружен', status: 'done' },
  { name: 'Текст извлечён', status: 'done' },
  { name: 'Сущности найдены', status: 'running' },
  { name: 'Связи построены', status: 'pending' },
  { name: 'Research Memory обновлена', status: 'pending' }
]
Extraction Result
GET /api/documents/:documentId/extraction

type ExtractionResultResponse = {
  documentId: string;
  entities: {
    materials: string[];
    processes: string[];
    equipment: string[];
    properties: string[];
    experts: string[];
  };
  parameters: {
    id: string;
    name: string;
    value: string;
    unit?: string;
    normalizedValue?: number;
    normalizedUnit?: string;
    sourceText?: string;
  }[];
  conclusions: {
    id: string;
    claim: string;
    confidence: 'low' | 'medium' | 'high';
    sourceIds: string[];
  }[];
  relations: {
    id: string;
    from: string;
    relation: string;
    to: string;
    confidence: 'low' | 'medium' | 'high';
  }[];
};
Query / Ask RLM
POST /api/query

type QueryRequest = {
  query: string;
  filters?: {
    material?: string;
    process?: string;
    geography?: 'russia' | 'foreign' | 'all';
    yearFrom?: number;
    yearTo?: number;
    confidence?: 'low' | 'medium' | 'high';
    sourceTypes?: ('publication' | 'report' | 'experiment' | 'patent' | 'standard')[];
  };
};
type QueryResponse = {
  queryId: string;
  summary: string;
  answerStatus: 'complete' | 'partial' | 'low_confidence';

  methods?: {
    id: string;
    name: string;
    applicability: string;
    limitations: string[];
    confidence: 'low' | 'medium' | 'high';
    sourcesCount: number;
  }[];

  keyFindings: {
    id: string;
    claim: string;
    confidence: 'low' | 'medium' | 'high';
    sourceIds: string[];
  }[];

  sources: SourceDto[];

  contradictions: ContradictionDto[];

  gaps: KnowledgeGapDto[];

  recommendations: string[];
};
Research Memory
GET /api/memory

type ResearchMemoryItem = {
  id: string;
  topic: string;
  claim: string;
  domain: 'hydrometallurgy' | 'pyrometallurgy' | 'ecology' | 'waste_processing' | 'other';
  status: 'confirmed' | 'conflicting' | 'weakly_supported' | 'new';
  confidence: 'low' | 'medium' | 'high';
  supportingSourcesCount: number;
  contradictingSourcesCount: number;
  lastUpdated: string;
  gaps: string[];
  relatedMaterials: string[];
  relatedProcesses: string[];
};
GET /api/memory/:memoryId

type ResearchMemoryDetails = ResearchMemoryItem & {
  supportingSources: SourceDto[];
  contradictingSources: SourceDto[];
  history: {
    date: string;
    event: string;
    changedBy?: string;
  }[];
};
Knowledge Graph
GET /api/graph?topic=...

type GraphResponse = {
  nodes: {
    id: string;
    label: string;
    type:
      | 'material'
      | 'process'
      | 'equipment'
      | 'parameter'
      | 'result'
      | 'source'
      | 'conclusion'
      | 'expert'
      | 'gap'
      | 'contradiction';
    confidence?: 'low' | 'medium' | 'high';
  }[];

  edges: {
    id: string;
    source: string;
    target: string;
    label: string;
    confidence?: 'low' | 'medium' | 'high';
  }[];
};
Sources
type SourceDto = {
  id: string;
  title: string;
  type: 'publication' | 'report' | 'experiment' | 'patent' | 'standard';
  year?: number;
  language: 'ru' | 'en' | 'other';
  geography: 'russia' | 'foreign' | 'unknown';
  authors?: string[];
  reliability: 'low' | 'medium' | 'high';
  excerpt?: string;
  url?: string;
};
GET /api/sources
GET /api/sources/:sourceId
Contradictions & Gaps
GET /api/contradictions

type ContradictionDto = {
  id: string;
  topic: string;
  description: string;
  sourceA: SourceDto;
  sourceB: SourceDto;
  claimA: string;
  claimB: string;
  possibleReason?: string;
  severity: 'low' | 'medium' | 'high';
};
GET /api/gaps

type KnowledgeGapDto = {
  id: string;
  topic: string;
  description: string;
  missingCombination?: {
    material?: string;
    process?: string;
    condition?: string;
    geography?: string;
  };
  priority: 'low' | 'medium' | 'high';
  recommendation?: string;
};
Export
POST /api/reports/export

type ExportReportRequest = {
  title: string;
  format: 'pdf' | 'markdown' | 'json';
  queryId?: string;
  memoryItemIds?: string[];
  includeGraph?: boolean;
  includeSources?: boolean;
  includeContradictions?: boolean;
  includeGaps?: boolean;
};
type ExportReportResponse = {
  reportId: string;
  downloadUrl: string;
  format: 'pdf' | 'markdown' | 'json';
  createdAt: string;
};