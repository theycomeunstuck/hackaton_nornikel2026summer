# R&D Evidence Hub — Frontend overview для backend-разработчика

## 1. Назначение продукта

**R&D Evidence Hub** — это корпоративная рабочая область для проверки научно-технических утверждений по источникам.

Продукт не является чат-ботом. Основная логика интерфейса строится вокруг доказательной базы:

- пользователь формулирует научно-технический вопрос;
- система разбирает запрос на материалы, процессы, условия и ограничения;
- система возвращает краткий вывод;
- каждый вывод должен опираться на проверяемые источники;
- утверждения связываются с источниками, страницами, фрагментами, условиями и графом связей;
- противоречия и пробелы показываются отдельно для экспертной проверки;
- результат можно экспортировать в Markdown или JSON.

Главный принцип интерфейса:

> Каждый вывод должен иметь проверяемый источник.

---

## 2. Текущий статус frontend

Frontend реализован как полноценный интерактивный прототип на mock-данных.

Текущая рабочая ветка frontend:

```text
frontend/evidence-hub
```

Текущий стек:

```text
Vite
React
TypeScript
Tailwind CSS
React Router
@xyflow/react
```

Проект сейчас работает без backend-интеграции. Все данные берутся из локальных mock-файлов.

---

## 3. Что сейчас уже есть в frontend

На текущий момент frontend показывает почти весь будущий пользовательский сценарий продукта:

1. Вход в систему.
2. Обзор доказательной базы.
3. Поиск доказательств по научно-техническому вопросу.
4. Таблица утверждений с источниками.
5. Граф связей.
6. База утверждений.
7. Источники.
8. Противоречия.
9. Загрузка документа с pipeline обработки.
10. Экспорт Markdown/JSON.

Но всё это пока работает на mock-данных. Backend-разработчику важно понять: ему нужно не просто сделать API для чат-ответа, а отдать frontend’у **структурированный доказательный результат**.

Минимальный backend MVP:

```text
POST /api/search -> SearchResult
POST /api/documents/upload
GET /api/documents/{id}/status
GET /api/documents/{id}/extraction
GET /api/sources
GET /api/claims
GET /api/graph
GET /api/contradictions
GET /api/gaps
```

Для начала backend-разработчику лучше всего сфокусироваться на `POST /api/search`, потому что это центральный экран продукта.

---

## 4. Основные страницы

### 4.1 AuthPage

Маршрут:

```text
/auth
```

Назначение:

- вход в защищённую рабочую область;
- сейчас используется mock-auth;
- после входа открываются защищённые страницы.

Текущий тестовый доступ:

```text
researcher@demo.local / demo123
```

В будущем backend должен заменить mock-auth на реальные endpoints авторизации.

---

### 4.2 DashboardPage / Обзор

Маршрут:

```text
/dashboard
```

Назначение:

- стартовая страница продукта;
- показывает главные действия пользователя:
  - найти доказательства;
  - загрузить документ;
  - открыть базу утверждений;
- показывает краткую сводку по документам, утверждениям, источникам и вопросам для проверки.

Backend в будущем должен отдавать агрегированную статистику по корпусу документов и доказательной базе.

---

### 4.3 SearchPage / Поиск доказательств

Маршрут:

```text
/search
```

Главная страница продукта.

Назначение:

- пользователь вводит научно-технический вопрос;
- система показывает:
  - краткий вывод;
  - таблицу доказательств;
  - разбор запроса;
  - граф связей;
  - источники;
  - противоречия;
  - пробелы;
  - экспорт результата.

Центральный объект страницы:

```ts
type SearchResult = unknown;
```

Именно backend должен будет возвращать полноценный `SearchResult` в ответ на поисковый запрос.

---

### 4.4 ClaimsPage / База утверждений

Маршрут:

```text
/claims
```

Назначение:

- реестр проверяемых утверждений;
- каждое утверждение связано с источником, условиями, достоверностью и возможными ограничениями;
- есть фильтрация по направлению, статусу, достоверности, материалу, процессу, типу источника и тексту.

Backend должен будет отдавать список утверждений и поддерживать фильтрацию/поиск.

---

### 4.5 GraphPage / Граф знаний

Маршрут:

```text
/graph
```

Назначение:

- визуализация связей между:
  - утверждениями;
  - материалами;
  - процессами;
  - технологиями;
  - оборудованием;
  - условиями;
  - эффектами;
  - источниками;
  - противоречиями;
  - пробелами.

Используется библиотека:

```text
@xyflow/react
```

Backend должен отдавать граф в формате nodes/edges, совместимом с frontend-типами.

---

### 4.6 SourcesPage / Источники

Маршрут:

```text
/sources
```

Назначение:

- список документов, публикаций, отчётов, протоколов и фрагментов;
- показывает тип источника, год, надёжность, связанные утверждения и ссылки на страницы/фрагменты.

Backend должен отдавать источники и связи между источниками и утверждениями.

---

### 4.7 ContradictionsPage / Противоречия

Маршрут:

```text
/contradictions
```

Назначение:

- показывает конфликтующие утверждения;
- помогает эксперту увидеть, где разные источники дают несовпадающие выводы;
- показывает возможную причину конфликта и следующий шаг проверки.

Backend должен уметь возвращать структурированные противоречия между claims.

---

### 4.8 UploadPage / Загрузка документов

Маршрут:

```text
/upload
```

Назначение:

- загрузка нового документа;
- сейчас реализована локальная имитация pipeline;
- пользователь выбирает файл;
- интерфейс показывает этапы обработки:
  1. файл загружен;
  2. текст извлечён;
  3. фрагменты сформированы;
  4. утверждения извлечены;
  5. сущности и условия найдены;
  6. связи графа построены;
  7. индекс доказательств обновлён.

Backend должен будет реализовать реальную загрузку и обработку документа.

---

### 4.9 ExportPage / Экспорт

Маршрут:

```text
/export
```

Назначение:

- объясняет, как формируются отчёты;
- реальный экспорт Markdown и JSON сейчас выполняется из SearchPage;
- PDF должен формироваться на backend в будущем.

---

## 5. Основные frontend-сущности

Ниже перечислены ключевые domain entities, на которые backend должен ориентироваться.

---

### 5.1 SearchResult

Главный контракт между backend и frontend для страницы поиска.

Ожидаемая структура:

```ts
type SearchResult = {
  id: string;
  query: string;
  parsedQuery: ParsedQuery;
  answer: AnswerSummary;
  evidence: EvidenceClaim[];
  graph: KnowledgeGraph;
  sources: SourceRef[];
  contradictions: Contradiction[];
  gaps: KnowledgeGap[];
};
```

Backend должен возвращать не просто текстовый ответ, а полный объект результата.

---

### 5.2 ParsedQuery

Показывает, как система поняла запрос пользователя.

Примерная структура:

```ts
type ParsedQuery = {
  intent: string;
  normalizedQuestion: string;
  materials: string[];
  processes: string[];
  technologies: string[];
  equipment?: string[];
  conditions: Condition[];
  geography?: string[];
  timeRange?: {
    from?: number;
    to?: number;
  };
};
```

Назначение для backend:

- извлечь смысл запроса;
- выделить материалы, процессы, технологии, условия;
- вернуть эти данные в структурированном виде.

---

### 5.3 AnswerSummary

Краткий вывод по результату поиска.

```ts
type AnswerSummary = {
  shortConclusion: string;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  keyFindings?: string[];
  warnings?: string[];
};
```

Важно:

- `shortConclusion` не должен быть “голым” LLM-ответом;
- он должен быть связан с evidence claims;
- уровень достоверности должен объясняться.

---

### 5.4 EvidenceClaim

Главная единица доказательной базы.

```ts
type EvidenceClaim = {
  id: string;
  text: string;
  materials: string[];
  processes: string[];
  technologies?: string[];
  equipment?: string[];
  conditions?: Condition[];
  effect?: Effect;
  source: SourceRef;
  confidence: ConfidenceLevel;
  year?: number;
  geography?: string;
};
```

Каждое фактическое утверждение должно иметь ссылку на источник.

---

### 5.5 SourceRef

Ссылка на источник, страницу или фрагмент.

```ts
type SourceRef = {
  sourceId: string;
  title: string;
  type: string;
  year?: number;
  authors?: string[];
  page?: number;
  chunkId?: string;
  reliability?: ConfidenceLevel;
};
```

Backend должен поддерживать связь:

```text
claim -> source -> page/chunk
```

---

### 5.6 KnowledgeGraph

Граф связей для React Flow.

```ts
type KnowledgeGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
```

Узлы могут быть типов:

```text
claim
material
process
technology
equipment
condition
effect
source
contradiction
gap
```

Связи могут быть типов:

```text
supports
mentions
has_condition
has_effect
derived_from
contradicts
has_gap
uses_equipment
applies_to_process
contains
requires
reduces
```

Backend должен отдавать graph data отдельно, а frontend уже визуализирует их через React Flow.

---

### 5.7 Contradiction

Противоречие между утверждениями или источниками.

```ts
type Contradiction = {
  id: string;
  title: string;
  description: string;
  claimA?: EvidenceClaim;
  claimB?: EvidenceClaim;
  sourceA?: SourceRef;
  sourceB?: SourceRef;
  severity: "low" | "medium" | "high";
  status?: "possible" | "confirmed" | "needs_review";
  possibleReason?: string;
  recommendation?: string;
};
```

Противоречие не считается ошибкой системы. Это зона для экспертной проверки.

---

### 5.8 KnowledgeGap

Пробел в доказательной базе.

```ts
type KnowledgeGap = {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  recommendation?: string;
  relatedMaterials?: string[];
  relatedProcesses?: string[];
};
```

---

## 6. Mock-данные на frontend

Сейчас frontend использует локальные mock-данные для трёх рабочих сценариев.

---

### 6.1 Обессоливание воды

Темы:

```text
sulfates
chlorides
Ca
Mg
Na
dry residue <= 1000 mg/dm3
reverse osmosis
ion exchange polishing
```

---

### 6.2 Циркуляция католита при электроэкстракции никеля

Темы:

```text
nickel electrowinning
catholyte circulation
flow velocity
circulation pump
stable cathode deposit
```

---

### 6.3 Au / Ag / МПГ между штейном и шлаком

Темы:

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

## 7. Какие endpoints нужны backend

Ниже минимальный набор API, который нужен для перехода с mock-данных на реальный backend.

---

## 7.1 Auth API

### POST `/api/auth/login`

Назначение:

- авторизация пользователя.

Request:

```json
{
  "email": "researcher@company.local",
  "password": "password"
}
```

Response:

```json
{
  "accessToken": "string",
  "user": {
    "id": "string",
    "name": "Инженер-исследователь",
    "email": "researcher@company.local",
    "role": "researcher",
    "organization": "Научно-технический центр"
  }
}
```

---

### GET `/api/auth/me`

Назначение:

- восстановление пользователя после refresh.

Response:

```json
{
  "id": "string",
  "name": "Инженер-исследователь",
  "email": "researcher@company.local",
  "role": "researcher",
  "organization": "Научно-технический центр"
}
```

---

## 7.2 Search API

### POST `/api/search`

Главный endpoint для SearchPage.

Request:

```json
{
  "query": "Какая технология подходит для обессоливания воды с сульфатами и хлоридами 200-300 мг/л?",
  "filters": {
    "geography": null,
    "sourceType": null,
    "confidence": null,
    "yearFrom": 2020,
    "yearTo": 2026
  }
}
```

Response:

```json
{
  "id": "search-result-id",
  "query": "string",
  "parsedQuery": {},
  "answer": {},
  "evidence": [],
  "graph": {
    "nodes": [],
    "edges": []
  },
  "sources": [],
  "contradictions": [],
  "gaps": []
}
```

Response должен соответствовать `SearchResult`.

---

## 7.3 Claims API

### GET `/api/claims`

Назначение:

- получить реестр утверждений.

Query params:

```text
scenario
status
confidence
material
process
sourceType
q
```

Response:

```json
{
  "items": [],
  "total": 0
}
```

---

### GET `/api/claims/{claimId}`

Назначение:

- получить подробности по утверждению.

Response должен включать:

```json
{
  "claim": {},
  "source": {},
  "conditions": [],
  "effect": {},
  "relatedContradictions": [],
  "relatedGaps": [],
  "graphRelations": []
}
```

---

## 7.4 Sources API

### GET `/api/sources`

Назначение:

- получить список источников.

Query params:

```text
type
geography
reliability
yearFrom
yearTo
q
```

Response:

```json
{
  "items": [],
  "total": 0
}
```

---

### GET `/api/sources/{sourceId}`

Назначение:

- получить источник, связанные claims и фрагменты.

Response:

```json
{
  "source": {},
  "claims": [],
  "chunks": []
}
```

---

## 7.5 Graph API

### GET `/api/graph`

Назначение:

- получить граф знаний.

Query params:

```text
scenario
queryId
claimId
sourceId
```

Response:

```json
{
  "nodes": [],
  "edges": []
}
```

---

## 7.6 Contradictions API

### GET `/api/contradictions`

Назначение:

- получить список противоречий.

Query params:

```text
severity
status
topic
sourceType
q
```

Response:

```json
{
  "items": [],
  "total": 0
}
```

---

## 7.7 Gaps API

### GET `/api/gaps`

Назначение:

- получить пробелы доказательной базы.

Response:

```json
{
  "items": [],
  "total": 0
}
```

---

## 7.8 Documents API

### POST `/api/documents/upload`

Назначение:

- загрузить документ.

Request:

```text
multipart/form-data
file: File
```

Response:

```json
{
  "documentId": "string",
  "status": "queued"
}
```

---

### GET `/api/documents/{documentId}/status`

Назначение:

- получить статус обработки документа.

Response:

```json
{
  "documentId": "string",
  "status": "queued | processing | completed | failed",
  "progress": 0,
  "steps": [
    {
      "id": "file_uploaded",
      "title": "Файл загружен",
      "status": "done"
    }
  ]
}
```

---

### GET `/api/documents/{documentId}/extraction`

Назначение:

- получить результат извлечения после обработки документа.

Response:

```json
{
  "documentId": "string",
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

## 7.9 Export API

Сейчас Markdown и JSON формируются на frontend.

PDF лучше формировать на backend.

### POST `/api/reports/export`

Request:

```json
{
  "format": "pdf",
  "searchResultId": "string",
  "options": {
    "includeGraph": true,
    "includeSources": true,
    "includeContradictions": true,
    "includeGaps": true
  }
}
```

Response:

```json
{
  "reportId": "string",
  "downloadUrl": "string",
  "format": "pdf"
}
```

---

## 8. Что backend должен учитывать

### 8.1 Не нужен обычный chatbot response

Frontend ожидает не просто:

```json
{
  "answer": "..."
}
```

А полный структурированный объект:

```json
{
  "parsedQuery": {},
  "answer": {},
  "evidence": [],
  "sources": [],
  "graph": {},
  "contradictions": [],
  "gaps": []
}
```

---

### 8.2 Утверждение без источника не должно считаться фактом

Если backend генерирует claim, он должен вернуть:

```text
claim text
sourceId
page/chunk
confidence
conditions
```

---

### 8.3 Числовые условия должны быть структурированы

Плохо:

```json
{
  "condition": "sulfates 200-300 mg/l"
}
```

Лучше:

```json
{
  "parameter": "sulfates",
  "operator": "range",
  "min": 200,
  "max": 300,
  "unit": "mg/l"
}
```

---

### 8.4 Graph должен быть связан с claims

Граф не должен быть декоративной картинкой. Он должен помогать понять связи между:

```text
claim
source
material
process
condition
effect
contradiction
gap
```

---

### 8.5 Противоречия и пробелы — отдельные сущности

Их не нужно прятать в тексте ответа.

Frontend показывает их отдельно, поэтому backend должен возвращать их структурировано.

---

## 9. Как frontend сейчас устроен для будущей интеграции

Сейчас есть mock-слой и API-ready stubs.

Ожидаемая стратегия интеграции:

```text
1. Сначала заменить mock search на POST /api/search.
2. Потом подключить GET /api/sources.
3. Потом подключить GET /api/claims.
4. Потом подключить upload pipeline.
5. Потом подключить PDF export.
```

Рекомендуемый порядок backend-интеграции:

```text
1. SearchResult API
2. Sources API
3. Claims API
4. Documents Upload API
5. Graph API
6. Contradictions/Gaps API
7. PDF Export API
8. Real Auth
```

---

## 10. Что backend-разработчику нужно сделать в первую очередь

Минимум для интеграции с текущим frontend.

---

### Priority 1

```text
POST /api/search
```

Должен вернуть полный `SearchResult`.

Это главный endpoint, потому что SearchPage — центральная рабочая область продукта.

---

### Priority 2

```text
POST /api/documents/upload
GET /api/documents/{id}/status
GET /api/documents/{id}/extraction
```

Нужно, чтобы UploadPage работал с реальной обработкой.

---

### Priority 3

```text
GET /api/sources
GET /api/claims
GET /api/graph
GET /api/contradictions
GET /api/gaps
```

Нужно, чтобы остальные страницы перестали зависеть от mock data.

---

### Priority 4

```text
POST /api/reports/export
```

Нужно для PDF-отчётов.

---

## 11. Frontend routes

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

Все маршруты, кроме `/auth`, защищены mock-auth.

---

## 12. Локальный запуск frontend

```bash
npm install
npm run dev
```

Проверка типов:

```bash
npm run typecheck
```

Сборка:

```bash
npm run build
```

---

## 13. Важные ограничения текущего frontend

Сейчас frontend:

- не подключён к реальному backend;
- не выполняет реальную загрузку документов;
- не делает реальный RAG-поиск;
- не извлекает claims из файлов;
- не строит граф на основе реальных документов;
- использует mock SearchResult;
- использует mock auth;
- формирует Markdown/JSON отчёты локально;
- PDF отмечен как будущая серверная функция.

---

## 14. Ключевой вывод для backend

Backend должен строить не “ответ чат-бота”, а **доказательный объект анализа**.

Главный результат backend — это:

```text
SearchResult
```

В нём должны быть:

```text
разбор запроса
краткий вывод
таблица утверждений
источники
граф связей
противоречия
пробелы
метаданные для экспорта
```

Если backend вернёт только текстовый ответ, frontend потеряет свою главную ценность.

---

## 15. Практический ориентир для backend-разработчика

В первую очередь нужно договориться о контракте `SearchResult`.

Минимальный рабочий сценарий:

1. Frontend отправляет запрос пользователя на `POST /api/search`.
2. Backend разбирает запрос.
3. Backend ищет релевантные документы и фрагменты.
4. Backend формирует claims.
5. Backend связывает claims с sources/page/chunk.
6. Backend считает confidence.
7. Backend выделяет contradictions и gaps.
8. Backend строит graph nodes/edges.
9. Backend возвращает полный `SearchResult`.
10. Frontend отображает результат без дополнительной догадки.

Именно это отличает продукт от обычного чат-интерфейса.

---

## 16. Рекомендуемые первые backend-задачи

### Задача 1 — зафиксировать DTO

Согласовать DTO для:

- `SearchResultDto`;
- `ParsedQueryDto`;
- `AnswerSummaryDto`;
- `EvidenceClaimDto`;
- `SourceRefDto`;
- `KnowledgeGraphDto`;
- `GraphNodeDto`;
- `GraphEdgeDto`;
- `ContradictionDto`;
- `KnowledgeGapDto`.

---

### Задача 2 — сделать `/api/search` на статических данных

На первом этапе backend может вернуть один из заранее подготовленных сценариев, но уже через настоящий endpoint.

Цель:

- проверить интеграцию frontend/backend;
- убрать прямую зависимость SearchPage от frontend mock;
- убедиться, что контракт SearchResult подходит.

---

### Задача 3 — подключить реальные документы

После проверки контракта можно подключать:

- загрузку файлов;
- разбиение на chunks;
- хранение source references;
- извлечение claims;
- поиск по корпусу.

---

### Задача 4 — связать SearchPage с реальным RAG/LLM pipeline

Важно: LLM должен возвращать не только текстовый вывод, а структурированные данные, которые можно проверить и отобразить в интерфейсе.

---

## 17. Критерий готовности backend MVP

Backend MVP можно считать готовым, если frontend может получить с backend полный `SearchResult` и отобразить:

- краткий вывод;
- таблицу доказательств;
- источники;
- граф связей;
- противоречия;
- пробелы;
- данные для экспорта.

Без этого frontend будет выглядеть работающим, но смысл evidence-first продукта не раскроется.
