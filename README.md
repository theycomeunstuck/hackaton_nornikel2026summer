# R&D Evidence Hub — Frontend README для backend-разработчика

> Текущий документ описывает **реальное состояние frontend-проекта на данный момент** и фиксирует, что именно backend должен отдать, чтобы заменить mock-данные реальной интеграцией.

---

## 1. Что это за продукт

**R&D Evidence Hub** — это frontend-прототип evidence-first платформы для R&D-специалистов, которые работают с научно-техническими документами, публикациями, отчётами, протоколами экспериментов и технологическими материалами.

Система не должна работать как обычный chatbot. Главная ценность интерфейса — не “текстовый ответ”, а **проверяемая доказательная структура**:

1. пользователь задаёт научно-технический вопрос;
2. система разбирает запрос на материалы, процессы, оборудование, параметры и условия;
3. система возвращает краткий вывод;
4. каждый вывод/фрагмент доказательства связан с источником;
5. источник содержит страницу, chunk id, тип документа, год и уровень надёжности;
6. отдельно показываются противоречия и пробелы;
7. результат визуализируется в графе знаний;
8. результат можно экспортировать в Markdown/JSON, а в будущем — PDF.

Главный принцип продукта:

> Фактическое утверждение без источника не считается доказанным.

---

## 2. Текущий статус проекта

Frontend уже реализован как полноценный интерактивный MVP-прототип на mock-данных.

Текущая основная ветка frontend:

```bash
frontend/evidence-hub
```

Текущий стек:

```text
Vite
React 18
TypeScript
Tailwind CSS
React Router 7
@xyflow/react
```

Проект сейчас:

- запускается локально;
- имеет защищённую рабочую область через mock-auth;
- показывает все основные страницы продукта;
- работает на mock-данных;
- имеет mock API layer;
- имеет adapter layer для нормализации SearchResult;
- не подключён к реальному backend;
- не выполняет настоящий RAG/поиск;
- не выполняет настоящую загрузку/обработку документов;
- формирует Markdown/JSON экспорт на frontend;
- PDF экспорт отмечен как будущая backend-функция.

---

## 3. Локальный запуск frontend

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
```

Проверка TypeScript:

```bash
npm run typecheck
```

Preview production build:

```bash
npm run preview
```

Скрипты из `package.json`:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "typecheck": "tsc -b",
  "preview": "vite preview"
}
```

---

## 4. Структура проекта

Актуальная структура frontend:

```text
src/
  app/
    App.tsx
    router.tsx
    providers/

  entities/
    auth/
    claim/
    contradiction/
    document/
    gap/
    graph/
    query/
    report/
    source/

  pages/
    AuthPage/
    DashboardPage/
    SearchPage/
    ClaimsPage/
    GraphPage/
    SourcesPage/
    ContradictionsPage/
    ExportPage/
    UploadPage/

  shared/
    api/
      searchApi.ts
      searchResultAdapter.ts

    lib/
      claimStats.ts
      contradictionStats.ts
      dashboardStats.ts
      downloadFile.ts
      exportEvidenceReport.ts
      exportMarkdown.ts
      sourceStats.ts

    mock/
      raw/
        sampleCatholyte.json
        sampleDesalination.json
        samplePgm.json
      curatedScenarioSummaries.ts
      demoScenarios.ts
      searchResults.mock.ts
      sources.mock.ts
      contradictions.mock.ts
      gaps.mock.ts
      documents.mock.ts
      upload.mock.ts

    types/
      search.ts

    ui/
      AnimatedSelect.tsx
      CollapsibleSection.tsx
      DisclosureSection.tsx
      ConfidenceBadge.tsx
      ContentContainer.tsx
      EvidencePageHeader.tsx
      FileDropzone.tsx
      MetricCard.tsx
      SectionCard.tsx
      SectionEyebrow.tsx
      StatusBadge.tsx
      filters/

  widgets/
    app-shell/
      AppShell.tsx
      Header.tsx
      Sidebar.tsx

    graph/
      KnowledgeGraph.tsx
      GraphLegend.tsx
      GraphNodeDetails.tsx

    result/
      ParsedQueryCard.tsx
      AnswerSummaryCard.tsx
      EvidenceTable.tsx
      SourcesPanel.tsx
      ContradictionsPanel.tsx
      GapsPanel.tsx
      ExportPanel.tsx

    search/
      SearchPanel.tsx
      DemoScenarioButtons.tsx
      FiltersPanel.tsx

    ProcessingPipeline/
      ProcessingPipeline.tsx

  styles/
    index.css
```

---

## 5. Маршруты frontend

Маршрутизация находится в:

```text
src/app/router.tsx
```

Актуальные маршруты:

```text
/auth
/dashboard
/search
/claims
/graph
/sources
/contradictions
/export
/upload
```

Поведение:

- `/auth` — публичная страница входа;
- все остальные страницы защищены через mock-auth;
- `/` редиректит на `/dashboard`;
- неизвестные маршруты внутри app shell редиректят на `/dashboard`.

---

## 6. Страницы и что backend должен для них отдать

### 6.1 `/auth` — AuthPage

Назначение:

- вход в рабочую область;
- сейчас используется mock-auth.

Текущий тестовый доступ:

```text
researcher@demo.local
demo123
```

Текущие mock-функции:

```text
src/entities/auth/api.ts
```

```ts
loginMock(request: LoginRequest): Promise<LoginResponse>
getCurrentUserMock(token: string): Promise<User | null>
logoutMock(): Promise<void>
```

Будущий backend:

```http
POST /api/auth/login
GET /api/auth/me
POST /api/auth/logout
```

---

### 6.2 `/dashboard` — DashboardPage / Обзор

Назначение:

- стартовая страница после входа;
- показывает общую сводку по доказательной базе;
- содержит быстрые действия:
  - найти доказательства;
  - загрузить документ;
  - открыть базу утверждений;
- показывает последние активности и блок “требует внимания”;
- имеет раскрываемую расширенную аналитику.

Сейчас данные считаются из mock-массивов:

```text
src/shared/mock/searchResults.mock.ts
src/shared/mock/sources.mock.ts
src/shared/mock/contradictions.mock.ts
src/shared/mock/gaps.mock.ts
src/shared/lib/dashboardStats.ts
```

Будущий backend может отдать агрегированную сводку:

```http
GET /api/dashboard/summary
```

Но это не priority 1. В первую очередь важнее подключить `/api/search`.

---

### 6.3 `/search` — SearchPage / Поиск доказательств

Главная страница продукта.

Текущее поведение:

- есть поле ввода научно-технического вопроса;
- есть 3 подготовленных demo-сценария;
- выбор demo-сценария подставляет пример запроса;
- кнопка поиска загружает соответствующий mock SearchResult;
- результат разбит на раскрываемые секции:
  - разбор запроса;
  - краткий вывод;
  - таблица доказательств;
  - граф связей;
  - источники;
  - противоречия;
  - пробелы;
  - экспорт.

Текущий mock API:

```text
src/shared/api/searchApi.ts
```

```ts
searchEvidenceByScenario(scenarioId: DemoScenarioId): Promise<SearchResult>
```

Текущий adapter:

```text
src/shared/api/searchResultAdapter.ts
```

```ts
normalizeSearchResult(raw: unknown): SearchResult
```

Backend priority 1:

```http
POST /api/search
```

Этот endpoint должен вернуть полный `SearchResult`.

---

### 6.4 `/claims` — ClaimsPage / База утверждений

Назначение:

- реестр проверяемых научно-технических утверждений;
- показывает карточки утверждений;
- каждая карточка имеет источник, условия, материалы, процессы, оборудование и confidence;
- карточки раскрываются через “Подробнее”;
- есть фильтры:
  - направление;
  - статус;
  - достоверность;
  - тип источника;
  - материалы;
  - текстовый поиск.

Сейчас используется mock-слой.

Будущий backend:

```http
GET /api/claims
GET /api/claims/{claimId}
```

---

### 6.5 `/graph` — GraphPage / Граф знаний

Назначение:

- показывает связи между сущностями;
- используется `@xyflow/react`;
- есть demo-сценарии;
- граф использует цветовую семантику узлов и связей.

Сущности графа:

```text
material
process
equipment
parameter
claim
source
effect
technology
```

Связи графа:

```text
supports
contradicts
influences
requires
measured_in
derived_from
contains
selected_for
```

Будущий backend:

```http
GET /api/graph
```

Query-параметры могут быть:

```text
scenarioId
searchResultId
claimId
sourceId
```

---

### 6.6 `/sources` — SourcesPage / Источники

Назначение:

- список источников;
- показывает тип источника, год, надёжность, теги, связанные утверждения;
- карточки источников раскрываются через “Подробнее”;
- есть фильтры по типу, географии, надёжности, году и тексту.

Будущий backend:

```http
GET /api/sources
GET /api/sources/{sourceId}
```

---

### 6.7 `/contradictions` — ContradictionsPage / Противоречия

Назначение:

- показывает конфликтующие утверждения;
- показывает связанные пробелы;
- помогает эксперту понять, где выводы требуют проверки;
- противоречие не считается ошибкой системы, это зона экспертной проверки.

Будущий backend:

```http
GET /api/contradictions
GET /api/contradictions/{contradictionId}
```

---

### 6.8 `/upload` — UploadPage / Загрузка документов

Назначение:

- выбор файла;
- имитация pipeline обработки;
- отображение этапов:
  1. файл загружен;
  2. текст извлечён;
  3. фрагменты сформированы;
  4. утверждения извлечены;
  5. сущности и условия найдены;
  6. связи графа построены;
  7. индекс доказательств обновлён.

Текущий mock API:

```text
src/entities/document/api.ts
```

```ts
uploadDocumentMock(request): Promise<UploadDocumentMockResponse>
getProcessingStatusMock(documentId): Promise<ProcessingStatusMockResponse>
getExtractionResultMock(documentId): Promise<UploadExtractionResult>
```

Будущий backend:

```http
POST /api/documents/upload
GET /api/documents/{documentId}/status
GET /api/documents/{documentId}/extraction
```

---

### 6.9 `/export` — ExportPage / Экспорт

Назначение:

- объясняет форматы отчётов;
- реальный Markdown/JSON экспорт сейчас выполняется на frontend из SearchPage;
- PDF отмечен как будущая серверная функция.

Текущий report API stub:

```text
src/entities/report/api.ts
```

```ts
requestReportExport(request: ExportReportRequest): Promise<ExportReportResponse>
```

PDF сейчас возвращает статус:

```text
unsupported
```

Будущий backend:

```http
POST /api/reports/export
```

---

## 7. Текущие demo-сценарии

Frontend сейчас работает на 3 подготовленных сценариях.

Файл registry:

```text
src/shared/mock/demoScenarios.ts
```

Raw JSON:

```text
src/shared/mock/raw/sampleDesalination.json
src/shared/mock/raw/sampleCatholyte.json
src/shared/mock/raw/samplePgm.json
```

Curated summaries:

```text
src/shared/mock/curatedScenarioSummaries.ts
```

### 7.1 Обессоливание воды

ID в registry:

```text
desalination
```

Тема:

```text
сульфаты
хлориды
Ca
Mg
Na
сухой остаток
обессоливание
reverse osmosis
ion exchange polishing
```

### 7.2 Циркуляция католита

ID в registry:

```text
catholyte
```

Тема:

```text
nickel electrowinning
catholyte circulation
flow velocity
circulation pump
stable cathode deposit
```

### 7.3 Au / Ag / МПГ между штейном и шлаком

ID в registry:

```text
pgm
```

Тема:

```text
Au
Ag
PGM / МПГ
copper matte
nickel matte
slag
matte-slag separation
```

---

## 8. Главный frontend DTO: SearchResult

Актуальный frontend-тип находится здесь:

```text
src/shared/types/search.ts
```

Главная структура:

```ts
export interface SearchResult {
  id: string;
  scenarioId: DemoScenarioId;
  title: string;
  parsedQuery: ParsedQuery;
  answer: AnswerSummary;
  evidence: EvidenceItem[];
  graph: KnowledgeGraph;
  sources: SourceMetadata[];
  contradictions: Contradiction[];
  gaps: KnowledgeGap[];
  generatedAt: string;
}
```

Backend может либо:

1. сразу возвращать данные максимально близко к этому DTO;
2. либо возвращать свой DTO, который frontend будет приводить к `SearchResult` через adapter.

Но для быстрого подключения лучше договориться о DTO, максимально близком к текущему `SearchResult`.

---

## 9. Подробные DTO

### 9.1 Confidence

```ts
export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";
export type SupportedConfidenceLevel = "high" | "medium" | "low";
```

Для основных UI-элементов лучше использовать:

```text
high
medium
low
```

`unknown` допустим только как промежуточный fallback.

---

### 9.2 Condition

Числовые условия должны быть структурированными.

```ts
export type NumericOperator =
  | "equals"
  | "less_than"
  | "less_than_or_equal"
  | "greater_than"
  | "greater_than_or_equal"
  | "range"
  | "approximately"
  | "unknown";

export type ConditionKind =
  | "concentration"
  | "temperature"
  | "ph"
  | "flow_velocity"
  | "flow_rate"
  | "pressure"
  | "dry_residue"
  | "time"
  | "ratio"
  | "composition"
  | "equipment_setting";

export interface Condition {
  id: string;
  kind: ConditionKind;
  parameter: string;
  operator: Exclude<NumericOperator, "unknown">;
  value?: number;
  min?: number;
  max?: number;
  minValue?: number;
  maxValue?: number;
  unit: string;
  rawValue?: string;
  material?: string;
  note?: string;
  name?: string;
}
```

Пример хорошего условия:

```json
{
  "id": "cond-sulfates-200-300",
  "kind": "concentration",
  "parameter": "sulfates",
  "operator": "range",
  "min": 200,
  "max": 300,
  "unit": "mg/l",
  "rawValue": "200–300 mg/l"
}
```

Плохой вариант:

```json
{
  "condition": "sulfates 200-300 mg/l"
}
```

---

### 9.3 ParsedQuery

```ts
export interface ParsedQuery {
  id: string;
  originalText: string;
  normalizedQuestion: string;
  domain: "water_treatment" | "nickel_electrowinning" | "matte_slag_partitioning";
  intent:
    | "technology_selection"
    | "parameter_optimization"
    | "evidence_review"
    | "gap_analysis";
  materials: string[];
  processes: string[];
  equipment: string[];
  targetParameters: string[];
  numericConditions: Condition[];
  technologies?: string[];
  conditions?: Condition[];
  geography?: string[];
  timeScope?: {
    fromYear: number;
    toYear: number;
  };
  timeRange?: {
    fromYear: number;
    toYear: number;
  };
}
```

Что frontend показывает из этого блока:

- намерение запроса;
- предметную область;
- материалы;
- процессы;
- оборудование;
- целевые параметры;
- числовые условия;
- временной диапазон;
- географию, если есть.

---

### 9.4 AnswerSummary

```ts
export interface AnswerSummary {
  shortConclusion: string;
  confidence: SupportedConfidenceLevel;
  confidenceReason: string;
  keyFindings: string[];
  limitations: string[];
  warnings?: string[];
  recommendations?: string[];
}
```

Важно:

- `shortConclusion` должен быть чистым текстом без OCR/парсинг-шума;
- вывод не должен быть длинным фрагментом из источника;
- вывод должен опираться на `evidence`;
- `confidenceReason` должен объяснять, почему уровень уверенности именно такой;
- `limitations` и `warnings` не нужно прятать внутри текста.

---

### 9.5 EvidenceItem

```ts
export interface EvidenceItem {
  id: string;
  scenarioId: string;
  claimType:
    | "technology_selection"
    | "parameter_range"
    | "process_effect"
    | "material_behavior"
    | "equipment_requirement"
    | "source_limitation";
  statement: string;
  confidence: SupportedConfidenceLevel;
  confidenceReason: string;
  sourceRef: SourceRef;
  conditions: Condition[];
  effects: Effect[];
  materials: string[];
  processes: string[];
  equipment: string[];
  year: number;
  claim?: string;
  technologies?: string[];
  geography?: string;
}
```

`EvidenceItem` — главная единица доказательной таблицы.

Обязательно:

```text
id
statement
confidence
sourceRef
materials
processes
conditions
year
```

Каждый `EvidenceItem` должен иметь `sourceRef`.

---

### 9.6 SourceRef

```ts
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
  documentId?: string;
  sourceName?: string;
  sectionTitle?: string;
  geography?: string;
}
```

`SourceRef` нужен для связи:

```text
evidence item -> source -> page -> chunk
```

---

### 9.7 SourceMetadata

```ts
export interface SourceMetadata {
  id: string;
  title: string;
  sourceType: SourceType;
  year: number;
  authors: string[];
  organization?: string;
  documentId?: string;
  tags: string[];
  reliability: SupportedConfidenceLevel;
  geography?: string;
  language?: string;
  excerpt?: string;
}
```

`SearchResult.sources` должен содержать уникальный список источников, на которые ссылаются evidence items.

---

### 9.8 KnowledgeGraph

```ts
export type GraphNodeType =
  | "material"
  | "process"
  | "equipment"
  | "parameter"
  | "claim"
  | "source"
  | "effect"
  | "technology";

export type GraphEdgeRelation =
  | "supports"
  | "contradicts"
  | "influences"
  | "requires"
  | "measured_in"
  | "derived_from"
  | "contains"
  | "selected_for";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  confidence?: SupportedConfidenceLevel;
  metadata?: Record<string, string | number | boolean>;
  description?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: GraphEdgeRelation;
  label: string;
  confidence?: SupportedConfidenceLevel;
  sourceRef?: SourceRef;
  evidenceText?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

Требования:

- `edge.source` и `edge.target` должны ссылаться на существующие `node.id`;
- `id` узлов и связей должны быть стабильными;
- graph должен быть не декоративным, а связанным с evidence/source/claims.

---

### 9.9 Contradiction

```ts
export interface Contradiction {
  id: string;
  scenarioId: string;
  title: string;
  description: string;
  severity: "minor" | "moderate" | "critical";
  claimIds: string[];
  conflictingStatements: string[];
  sourceRefs: SourceRef[];
  confidence: SupportedConfidenceLevel;
  resolutionHint: string;
  topic?: string;
  status?: "possible" | "confirmed" | "resolved";
  possibleReason?: string;
  recommendation?: string;
}
```

Важно:

- противоречие не является ошибкой системы;
- это объект для экспертной проверки;
- его нельзя прятать внутри `answer.shortConclusion`;
- frontend показывает противоречия отдельно.

---

### 9.10 KnowledgeGap

```ts
export interface KnowledgeGap {
  id: string;
  scenarioId: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  affectedMaterials: string[];
  affectedProcesses: string[];
  missingEvidence: string;
  recommendedAction: string;
  confidence: SupportedConfidenceLevel;
  relatedSourceRefs: SourceRef[];
  topic?: string;
  priority?: "low" | "medium" | "high";
  relatedClaimIds?: string[];
  recommendation?: string;
}
```

Пробелы нужны для ответа на вопрос:

```text
чего не хватает, чтобы вывод был надёжным?
```

---

## 10. Priority API для backend

### Priority 1 — Search API

Самое важное для интеграции:

```http
POST /api/search
```

Request:

```json
{
  "query": "Выбрать технологию обессоливания воды по сульфатам, хлоридам, Ca, Mg, Na и сухому остатку.",
  "filters": {
    "sourceType": null,
    "confidence": null,
    "yearFrom": 2020,
    "yearTo": 2026,
    "geography": null
  }
}
```

Response:

```json
{
  "id": "search-desalination-001",
  "scenarioId": "desalination",
  "title": "Обессоливание воды",
  "parsedQuery": {},
  "answer": {},
  "evidence": [],
  "graph": {
    "nodes": [],
    "edges": []
  },
  "sources": [],
  "contradictions": [],
  "gaps": [],
  "generatedAt": "2026-07-04T00:00:00.000Z"
}
```

Минимальный MVP для backend:

- можно сначала возвращать один статический `SearchResult`;
- главное — отдавать его через настоящий endpoint;
- frontend после этого заменит `searchEvidenceByScenario()` на реальный `searchEvidence()`.

---

### Priority 2 — Documents API

```http
POST /api/documents/upload
GET /api/documents/{documentId}/status
GET /api/documents/{documentId}/extraction
```

Upload request:

```text
multipart/form-data
file: File
```

Upload response:

```json
{
  "documentId": "doc-001",
  "title": "pilot-report.pdf",
  "fileName": "pilot-report.pdf",
  "fileType": "application/pdf",
  "status": "uploaded",
  "uploadedAt": "2026-07-04T00:00:00.000Z"
}
```

Status response:

```json
{
  "documentId": "doc-001",
  "status": "processing",
  "progress": 42,
  "steps": [
    {
      "id": "file_uploaded",
      "title": "Файл загружен",
      "status": "done"
    },
    {
      "id": "text_extracted",
      "title": "Текст извлечён",
      "status": "processing"
    }
  ]
}
```

Extraction response:

```json
{
  "documentId": "doc-001",
  "materials": [],
  "processes": [],
  "equipment": [],
  "conditions": [],
  "claims": [],
  "sourceRefs": [],
  "graphRelations": []
}
```

---

### Priority 3 — Registry APIs

Для страниц `ClaimsPage`, `SourcesPage`, `ContradictionsPage`, `GraphPage`.

```http
GET /api/claims
GET /api/claims/{claimId}

GET /api/sources
GET /api/sources/{sourceId}

GET /api/graph

GET /api/contradictions
GET /api/contradictions/{contradictionId}

GET /api/gaps
```

---

### Priority 4 — Export API

Markdown/JSON сейчас делает frontend.

Backend нужен в первую очередь для PDF:

```http
POST /api/reports/export
```

Request:

```json
{
  "format": "pdf",
  "searchResultId": "search-desalination-001",
  "options": {
    "includeEvidenceTable": true,
    "includeSources": true,
    "includeContradictions": true,
    "includeGaps": true,
    "includeGraphSummary": true
  }
}
```

Response:

```json
{
  "reportId": "report-001",
  "format": "pdf",
  "filename": "evidence-report.pdf",
  "contentType": "application/pdf",
  "downloadUrl": "/api/reports/report-001/download",
  "generatedAt": "2026-07-04T00:00:00.000Z",
  "status": "ready"
}
```

---

### Priority 5 — Auth API

Сейчас auth полностью mock.

Будущий backend:

```http
POST /api/auth/login
GET /api/auth/me
POST /api/auth/logout
```

Login request:

```json
{
  "email": "researcher@demo.local",
  "password": "demo123"
}
```

Login response:

```json
{
  "accessToken": "jwt-or-session-token",
  "user": {
    "id": "researcher-001",
    "name": "Инженер-исследователь",
    "email": "researcher@demo.local",
    "role": "researcher",
    "organization": "Научно-технический центр"
  }
}
```

---

## 11. Как подключать backend к текущему frontend

Рекомендуемая стратегия:

```text
1. Не переписывать UI.
2. Не удалять mock-данные.
3. Добавить отдельный real API layer.
4. Оставить adapter layer.
5. Подключить real endpoint сначала только к SearchPage.
6. Сравнить backend response с SearchResult.
7. Нормализовать backend response через adapter.
8. Потом подключать остальные страницы.
```

Предлагаемая структура:

```text
src/shared/api/
  httpClient.ts
  searchApi.ts
  searchResultAdapter.ts
  backendSearchApi.ts
```

Пример будущей функции:

```ts
export async function searchEvidence(query: string, filters: SearchFilters): Promise<SearchResult> {
  const response = await httpClient.post("/api/search", { query, filters });
  return normalizeSearchResult(response);
}
```

Важно:

- `normalizeSearchResult()` уже существует;
- его можно расширить под backend DTO;
- UI не должен знать, mock это или real API.

---

## 12. Что backend не должен возвращать

Плохо:

```json
{
  "answer": "Для вашего случая лучше использовать обратный осмос..."
}
```

Такой ответ недостаточен.

Хорошо:

```json
{
  "parsedQuery": {},
  "answer": {
    "shortConclusion": "Для заданного состава воды наиболее обоснована комбинированная схема предварительной подготовки, мембранного обессоливания и polishing stage.",
    "confidence": "high",
    "confidenceReason": "Вывод поддержан несколькими источниками и числовыми условиями."
  },
  "evidence": [
    {
      "id": "ev-001",
      "statement": "Для состава с сульфатами и хлоридами 200–300 mg/l требуется контроль Ca/Mg перед мембранной стадией.",
      "confidence": "high",
      "sourceRef": {
        "sourceId": "src-001",
        "documentTitle": "Pilot desalination tests for sulfate-chloride mine water",
        "sourceType": "internal_report",
        "year": 2024,
        "page": 12,
        "chunkId": "water-pilot-2024-p12-c03"
      },
      "conditions": [],
      "effects": [],
      "materials": ["sulfates", "chlorides", "Ca", "Mg", "Na"],
      "processes": ["feed characterization"],
      "equipment": [],
      "year": 2024
    }
  ],
  "sources": [],
  "graph": {
    "nodes": [],
    "edges": []
  },
  "contradictions": [],
  "gaps": []
}
```

---

## 13. Backend checklist для первого рабочего `/api/search`

Endpoint считается пригодным для frontend-интеграции, если он возвращает:

- [ ] `id`
- [ ] `title`
- [ ] `scenarioId` или другой topic id
- [ ] `parsedQuery`
- [ ] `answer.shortConclusion`
- [ ] `answer.confidence`
- [ ] `answer.confidenceReason`
- [ ] `evidence[]`
- [ ] у каждого evidence есть `statement`
- [ ] у каждого evidence есть `sourceRef`
- [ ] у каждого sourceRef есть `sourceId`, `documentTitle`, `sourceType`, `year`, `page`, `chunkId`
- [ ] `sources[]`
- [ ] `graph.nodes[]`
- [ ] `graph.edges[]`
- [ ] `contradictions[]`
- [ ] `gaps[]`
- [ ] `generatedAt`

---

## 14. Валидация данных на backend

Backend должен следить за следующими правилами.

### 14.1 Каждый claim имеет источник

```text
EvidenceItem.sourceRef обязателен.
```

### 14.2 Числовые условия структурированы

```text
parameter + operator + value/min/max + unit
```

### 14.3 Confidence объясняется

```text
confidenceReason обязателен для answer и evidence.
```

### 14.4 Graph связан с evidence

Граф должен быть связан с реальными сущностями результата, а не быть независимой иллюстрацией.

### 14.5 Contradictions и gaps — отдельные массивы

Их нельзя прятать в `answer.shortConclusion`.

---

## 15. Рекомендуемый порядок backend-задач

### Задача 1 — согласовать SearchResult DTO

Согласовать поля:

```text
SearchResult
ParsedQuery
AnswerSummary
EvidenceItem
SourceRef
SourceMetadata
KnowledgeGraph
Contradiction
KnowledgeGap
```

### Задача 2 — сделать `/api/search` со статическим ответом

Можно начать с одного статического результата, похожего на текущий mock.

Цель:

- проверить CORS;
- проверить shape response;
- подключить frontend к реальному endpoint;
- убедиться, что UI не ломается.

### Задача 3 — добавить реальные source/chunk references

Подготовить хранение:

```text
document
source
page
chunk
claim
```

### Задача 4 — добавить поиск по корпусу

Минимально:

```text
query -> relevant chunks -> evidence candidates -> SearchResult
```

### Задача 5 — добавить загрузку документов

```text
upload -> extract text -> chunk -> index -> claims -> graph
```

### Задача 6 — подключить остальные endpoints

```text
claims
sources
graph
contradictions
gaps
reports
auth
```

---

## 16. Важные frontend-ограничения

На момент текущего MVP:

- frontend ожидает JSON;
- frontend не ожидает streaming response;
- frontend не ожидает HTML/Markdown как основной answer;
- frontend может показывать длинные evidence statements, но лучше возвращать аккуратные короткие утверждения;
- frontend поддерживает раскрываемые карточки и секции;
- frontend умеет визуализировать graph через nodes/edges;
- frontend умеет локально экспортировать Markdown/JSON из SearchResult;
- frontend лучше всего работает, когда backend возвращает стабильные id.

---

## 17. CORS и окружение

Сейчас frontend работает локально через Vite.

Обычно frontend URL:

```text
http://localhost:5173
```

Backend должен разрешить CORS для frontend origin на время разработки.

Рекомендуемые env-переменные для будущей интеграции:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

Сейчас таких env-переключателей может ещё не быть. Их стоит добавить на этапе интеграции.

---

## 18. Definition of Done для backend MVP

Backend MVP считается готовым для frontend, если:

1. frontend отправляет запрос на `POST /api/search`;
2. backend возвращает полный `SearchResult`;
3. frontend отображает:
   - разбор запроса;
   - краткий вывод;
   - таблицу доказательств;
   - граф связей;
   - источники;
   - противоречия;
   - пробелы;
   - экспорт;
4. каждый evidence item связан с source/page/chunk;
5. сборка frontend не ломается;
6. mock-сценарии можно оставить как fallback/demo.

---

## 19. Самый важный вывод для backend-разработчика

Frontend уже построен вокруг evidence-first модели.

Поэтому backend должен отдавать не “ответ чат-бота”, а **структурированный доказательный объект анализа**:

```text
SearchResult =
  parsedQuery
  + answer
  + evidence
  + sources
  + graph
  + contradictions
  + gaps
  + generatedAt
```

Если backend вернёт только текст, основная ценность текущего frontend потеряется.
