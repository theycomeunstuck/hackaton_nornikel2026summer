# Научный клубок — Frontend

Frontend для hackathon MVP **«Научный клубок»** — evidence-first интерфейс для работы с научно-техническими источниками, результатами RAG, графом знаний, источниками, пробелами, возможными противоречиями, загрузкой документов и экспортом evidence-отчёта.

Главный принцип продукта:

> **Нет источника — нет фактического утверждения.**

Frontend построен не как чат-бот, а как **evidence-first scientific dashboard**: пользователь видит, как система поняла запрос, какие утверждения и evidence найдены, какие источники их подтверждают, насколько можно доверять выводу, где есть противоречия, где есть пробелы и что можно экспортировать в отчёт.

---

## 1. Текущий статус

Frontend уже адаптирован под новый **app-level backend API**.

Поддерживаются три режима работы:

1. **Offline local fallback** — backend не запущен, интерфейс работает через локальные `sample_*_server.json`.
2. **Backend mock mode** — backend запущен через `py run.py`, но без большого SQLite/RAG-индекса; API возвращает mock-данные в той же форме.
3. **Backend RAG mode** — backend запущен с реальным `rag/data/index.sqlite` или внешним индексом через `RAG_DB_PATH`.

Во всех режимах основной UI строится вокруг одного контракта:

```text
SearchResult
```

---

## 2. Что реализовано во frontend

- App-level backend API integration.
- `VITE_API_BASE_URL` для подключения backend.
- Legacy fallback через `VITE_RAG_BASE_URL`.
- TypeScript-контракт `SearchResult`.
- Поддержка `queryId` и `mode: "rag" | "mock"`.
- Поддержка `graph.edges[].sourceRef = null`.
- API client с local mock fallback.
- `POST /api/query` для пользовательского поиска.
- `GET /api/scenarios` для demo-кнопок.
- `GET /api/health` для отображения режима `rag / mock / offline`.
- Dashboard integration через `/api/dashboard`.
- GraphPage integration через `/api/graph`.
- SourcesPage integration через `/api/sources`.
- Gaps/Contradictions integration через `/api/gaps` и `/api/contradictions`.
- Export integration через `/api/reports/export`.
- Upload pipeline integration через `/api/documents/upload`, `/status`, `/extraction`.
- Demo auth flow через `/api/auth/login` и `/api/auth/me`, если AuthPage используется.
- SearchPage с evidence-first flow.
- AnswerSummaryCard.
- ParsedQueryCard.
- EvidenceTable.
- SourcesPanel.
- GapsPanel.
- ContradictionsPanel.
- KnowledgeGraph.
- Loading / empty / error states.
- Отображение `sourceName`, `page`, `chunkId`, `documentId`.
- Preview для длинного `answer.shortConclusion`.
- Details modal для длинного `evidence.text`.
- Честное отображение `possible` / `needs_review` contradictions.

---

## 3. Стек

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Flow
- fetch-based API layer
- local mock fallback
- app-level backend API integration

---

## 4. Установка

```bash
npm install
```

---

## 5. Запуск frontend

```bash
npm run dev
```

Frontend должен открыться на Vite dev server, обычно:

```text
http://localhost:5173
```

Если backend недоступен, frontend не должен падать: он использует local fallback samples.

---

## 6. Сборка

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## 7. ENV

### `.env.example`

`.env.example` хранится в репозитории и служит шаблоном:

```env
# Научный клубок — frontend environment example.
# Скопируй этот файл в .env.local и при необходимости измени значения.

# App-level backend API.
# Backend запускается командой: py run.py
VITE_API_BASE_URL=http://127.0.0.1:8000

# Legacy fallback для старого RAG API-layer.
# Нужен только если часть кода ещё читает VITE_RAG_BASE_URL.
VITE_RAG_BASE_URL=http://127.0.0.1:8000
```

### `.env.local`

`.env.local` создаётся локально и **не коммитится**:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_RAG_BASE_URL=http://127.0.0.1:8000
```

Если backend запущен на другом порту:

```env
VITE_API_BASE_URL=http://127.0.0.1:8080
VITE_RAG_BASE_URL=http://127.0.0.1:8080
```

### `.gitignore`

Убедись, что локальные env-файлы не попадают в репозиторий:

```gitignore
.env.local
.env.*.local
```

Важно: переменные Vite, доступные в браузере, должны начинаться с `VITE_`.

---

## 8. Как запустить backend для frontend

Backend уровня `app` запускается из корня backend-проекта:

```bash
py run.py
```

Другие варианты:

```bash
py run.py --host 0.0.0.0 --port 8000
py run.py --port 8080
py run.py --reload
py run.py --db D:/path/to/index.sqlite
```

Ожидаемый backend base URL:

```text
http://127.0.0.1:8000
```

Swagger/OpenAPI backend:

```text
http://127.0.0.1:8000/docs
```

Проверка режима:

```bash
curl http://127.0.0.1:8000/api/health
```

Пример ответа:

```json
{
  "status": "ok",
  "service": "Научный клубок",
  "version": "...",
  "engine": "rag"
}
```

или:

```json
{
  "status": "ok",
  "service": "Научный клубок",
  "version": "...",
  "engine": "mock"
}
```

---

## 9. Backend modes

Backend может работать в двух режимах, но форма ответа для frontend остаётся одной.

| Mode | Когда включается | Что видит frontend |
|---|---|---|
| `rag` | есть `rag/data/index.sqlite` или задан `RAG_DB_PATH` | реальные RAG results |
| `mock` | индекса нет | demo-data в том же `SearchResult` contract |
| `offline` | backend недоступен | local `sample_*_server.json` fallback |

Frontend должен отображать режим в UI:

```text
RAG · real index
Demo · mock fallback
Offline · local samples
```

---

## 10. Главный контракт: `SearchResult`

Основной ответ backend — объект `SearchResult`.

Верхний уровень:

```ts
export interface SearchResult {
  parsedQuery: ParsedQuery;
  answer: AnswerSummary;
  evidence: EvidenceItem[];
  graph: KnowledgeGraph;
  gaps: KnowledgeGap[];
  contradictions: Contradiction[];
  sources: SourceRef[];
  queryId?: string;
  mode?: "rag" | "mock";
}
```

### `parsedQuery`

Показывает, как система поняла запрос:

```ts
interface ParsedQuery {
  intent: string;
  materials: string[];
  processes: string[];
  technologies: string[];
  properties: string[];
  conditions: Condition[];
  geography: string;
  timeRange: { from: number | null; to: number | null } | null;
}
```

### `answer`

Краткий evidence-based summary:

```ts
interface AnswerSummary {
  shortConclusion: string;
  confidence: "low" | "medium" | "high";
  confidenceReason: string;
  warnings: string[];
  numericMode: "none" | "approximate" | "structured";
}
```

Важно: `answer.shortConclusion` может быть длинным. UI должен показывать preview и кнопку **«Показать полностью»**.

### `evidence`

Главный блок результата. Каждая evidence-строка должна сохранять источник.

```ts
interface EvidenceItem {
  id: string;
  text: string;
  score: number;
  confidence: "low" | "medium" | "high";
  conditions: Condition[];
  matchedTerms: string[];
  numericStatus: "none" | "approximate" | "structured" | "unmatched";
  source: SourceRef;
}
```

Обязательные поля источника в UI:

```text
sourceName
page
chunkId
documentId
```

### `graph`

```ts
interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  sourceRef?: SourceRef | null;
  evidenceText?: string | null;
}
```

`sourceRef` может быть `null`, особенно в mock-графе. UI не должен падать.

Node types могут расширяться. Неизвестный тип нужно рендерить нейтрально.

Ожидаемые типы:

```text
material
process
technology
equipment
condition
effect
parameter
experiment
source
contradiction
gap
```

### `gaps`

Пробелы знания:

```ts
interface KnowledgeGap {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: "info" | "warning" | string;
}
```

### `contradictions`

Возможные или требующие проверки противоречия:

```ts
interface Contradiction {
  id: string;
  title: string;
  description: string;
  sourceA: SourceRef;
  sourceB: SourceRef;
  status: "possible" | "needs_review" | "confirmed";
}
```

UI labels:

| Backend status | UI label |
|---|---|
| `possible` | Возможное противоречие |
| `needs_review` | Требует экспертной проверки |
| `confirmed` | Подтверждено |

Не называй `possible` и `needs_review` подтверждёнными фактами.

### `sources`

Deduplicated список источников. В RAG-режиме это обычно `SourceRef`, в mock-режиме `/api/sources` может вернуть расширенный `Source` с `title`, `authors`, `reliability`, `excerpt`.

---

## 11. App-level backend endpoints

Frontend теперь строится против `app` API, а не против старого pure RAG API.

### Основные endpoint'ы

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Проверка backend и режима `rag/mock` |
| `GET` | `/api/stats` | Сырые stats индекса / mock stats |
| `GET` | `/api/scenarios` | Demo-сценарии для кнопок |
| `POST` | `/api/query` | Главный evidence-first поиск |
| `GET` | `/api/dashboard` | Cards, indexStats, domainsCoverage, recentClaims |
| `GET` | `/api/graph?topic=` | Граф знаний |
| `GET` | `/api/sources` | Источники |
| `GET` | `/api/sources/{sourceId}` | Один источник в mock-каталоге |
| `GET` | `/api/contradictions` | Агрегированные противоречия |
| `GET` | `/api/gaps` | Агрегированные пробелы |
| `POST` | `/api/reports/export` | Экспорт evidence report |
| `GET` | `/api/reports/{reportId}/download` | Скачать отчёт |
| `POST` | `/api/documents/upload` | Загрузка документа |
| `GET` | `/api/documents/{documentId}/status` | Статус обработки |
| `GET` | `/api/documents/{documentId}/extraction` | Извлечённые сущности/параметры/выводы |
| `POST` | `/api/auth/login` | Demo login |
| `GET` | `/api/auth/me` | Текущий пользователь по Bearer token |

---

## 12. Search API

Главный поиск:

```http
POST /api/query
```

Request:

```ts
{
  query: string;
  scenarioId?: string;
  filters?: {
    material?: string;
    process?: string;
    geography?: "domestic" | "foreign" | "russia" | "all";
    yearFrom?: number;
    yearTo?: number;
    confidence?: "low" | "medium" | "high";
    sourceTypes?: ("publication" | "report" | "experiment" | "patent" | "standard")[];
  };
}
```

Пример:

```ts
const result = await fetch(`${baseUrl}/api/query`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "Какая скорость потока католита оптимальна при электроэкстракции никеля?",
    filters: { geography: "foreign" },
  }),
}).then((r) => r.json());
```

`topK` в новом app-level endpoint не передаётся: backend сам управляет этим внутри `/api/query`.

---

## 13. Demo scenarios

Demo-кнопки получают сценарии от backend:

```http
GET /api/scenarios
```

Response:

```ts
type DemoScenario = {
  id: string;
  title: string;
  query: string;
};
```

После клика frontend вызывает:

```ts
await queryEvidence({
  query: scenario.query,
  scenarioId: scenario.id,
});
```

Backend scenario ids:

```text
desalination
catholyte
metals
```

В старых local samples третий сценарий может называться `pgm`. Frontend должен поддерживать alias:

```text
pgm -> metals
metals -> pgm sample fallback
```

---

## 14. Dashboard API

```http
GET /api/dashboard
```

Response shape:

```ts
interface DashboardResponse {
  mode: "rag" | "mock";
  cards: Array<{ label: string; value: string | number }>;
  indexStats?: Record<string, string | number | null> | null;
  domainsCoverage?: Record<string, number>;
  priorityGaps?: KnowledgeGap[];
  recentClaims?: EvidenceItem[];
}
```

Важно: карточки нужно рендерить динамически из `cards`, потому что набор может отличаться в `rag` и `mock`.

---

## 15. Graph API

```http
GET /api/graph
GET /api/graph?topic=<строка>
```

Response:

```ts
KnowledgeGraph
```

Если `topic` указан — backend возвращает граф по теме. Если `topic` не указан — обзорный граф.

---

## 16. Sources API

```http
GET /api/sources
```

Query params:

```text
geography
type
year_from
year_to
```

В RAG-режиме элементы похожи на `SourceRef`.
В mock-режиме элементы могут быть расширенными `Source`.

UI должен показывать:

```text
title или sourceName
sourceName
documentId
chunkId
page
year
geography
sourceType/type
authors
reliability
excerpt
```

---

## 17. Gaps and contradictions API

```http
GET /api/gaps
GET /api/contradictions
```

Эти endpoint'ы используются для отдельных страниц/панелей обзора.

SearchPage также отображает `gaps` и `contradictions` из текущего `SearchResult`.

---

## 18. Export API

Создание отчёта:

```http
POST /api/reports/export
```

Request:

```ts
{
  title: string;
  format: "markdown" | "json" | "pdf";
  queryId?: string;
  includeGraph?: boolean;
  includeSources?: boolean;
  includeContradictions?: boolean;
  includeGaps?: boolean;
}
```

Response:

```ts
{
  reportId: string;
  downloadUrl: string;
  format: "markdown" | "json" | "pdf";
  createdAt: string;
}
```

Затем:

```ts
window.open(`${baseUrl}${downloadUrl}`, "_blank");
```

Текущий backend использует `queryId` как текст запроса для повторного запуска поиска. Поэтому frontend должен передавать туда `lastQueryText`, если нужно экспортировать результат последнего поиска.

PDF сейчас может быть backend-заглушкой и отдавать JSON. В UI можно пометить PDF как beta/disabled.

---

## 19. Upload API

Загрузка документа:

```http
POST /api/documents/upload
```

`multipart/form-data`:

```text
file
title?
```

Response:

```ts
{
  documentId: string;
  title: string;
  fileName: string;
  fileType: "pdf" | "docx" | "txt" | "csv" | "xlsx";
  status: "uploaded" | "processing" | "processed" | "failed";
  uploadedAt: string;
}
```

Статус обработки:

```http
GET /api/documents/{documentId}/status
```

Response:

```ts
{
  documentId: string;
  status: "uploaded" | "processing" | "processed" | "failed";
  steps: Array<{
    id: string;
    name: string;
    description: string;
    status: "pending" | "running" | "done" | "failed";
  }>;
}
```

Извлечение:

```http
GET /api/documents/{documentId}/extraction
```

Response содержит:

```text
entities
parameters
conclusions
relations
```

---

## 20. Auth API

Demo login:

```http
POST /api/auth/login
```

Request:

```ts
{
  email: string;
  password: string;
}
```

Response:

```ts
{
  accessToken: string;
  user: {
    id: string;
    name: string;
    role: "researcher" | "analyst" | "manager" | "admin";
    organization?: string;
  };
}
```

Проверка пользователя:

```http
GET /api/auth/me
```

Header:

```http
Authorization: Bearer <token>
```

Большинство endpoint'ов не требуют авторизации. Auth нужен для demo-flow.

Важно: backend не использует cookies. В `fetch` не ставить:

```ts
credentials: "include"
```

---

## 21. Offline local fallback

Frontend хранит local samples:

```text
src/shared/mock/rag/sample_desalination_server.json
src/shared/mock/rag/sample_catholyte_server.json
src/shared/mock/rag/sample_pgm_server.json
```

Fallback logic:

1. Сначала frontend пытается обратиться к backend.
2. Если backend недоступен, используются local samples.
3. Для пользовательского поиска sample выбирается по эвристике:
   - вода / обессоливание / сухой остаток → `desalination`;
   - католит / никель / электроэкстракция → `catholyte`;
   - Au / Ag / МПГ / PGM / штейн / шлак / metals → `pgm`.

Local fallback нужен для demo, разработки без backend и защиты от падения интерфейса.

---

## 22. Важные frontend-файлы

Названия могут немного отличаться, но смысловой слой должен сохраняться.

```text
src/shared/types/rag.ts
src/shared/api/appApi.ts
src/shared/api/ragApi.ts
src/shared/api/ragResultAdapter.ts
src/shared/mock/rag/

src/widgets/search/DemoScenarioButtons.tsx

src/widgets/result/AnswerSummaryCard.tsx
src/widgets/result/ParsedQueryCard.tsx
src/widgets/result/EvidenceTable.tsx
src/widgets/result/SourcesPanel.tsx
src/widgets/result/GapsPanel.tsx
src/widgets/result/ContradictionsPanel.tsx
src/widgets/result/ExportPanel.tsx

src/widgets/graph/KnowledgeGraph.tsx

src/pages/DashboardPage/
src/pages/SearchPage/
src/pages/GraphPage/
src/pages/SourcesPage/
src/pages/ContradictionsPage/
src/pages/UploadPage/
src/pages/AuthPage/
src/pages/ExportPage/
```

---

## 23. Manual QA checklist

Перед push/merge проверь:

```text
[ ] npm run build проходит
[ ] .env.local не отслеживается Git
[ ] frontend запускается без backend
[ ] offline fallback работает
[ ] backend mock mode работает через py run.py
[ ] /api/health показывает mock или rag
[ ] SearchPage вызывает POST /api/query
[ ] Demo buttons используют GET /api/scenarios
[ ] desalination scenario работает
[ ] catholyte scenario работает
[ ] metals / pgm scenario работает
[ ] EvidenceTable показывает sourceName/page/chunkId/documentId
[ ] SourcesPanel показывает sourceName/page/chunkId/documentId
[ ] KnowledgeGraph не падает при sourceRef=null
[ ] KnowledgeGraph edge details показывает source/evidence где доступно
[ ] long answer не ломает layout
[ ] long evidence text открывается через modal/details
[ ] DashboardPage получает cards из /api/dashboard
[ ] GraphPage получает graph из /api/graph
[ ] SourcesPage получает данные из /api/sources
[ ] Gaps/Contradictions отображаются честно
[ ] possible/needs_review не называются confirmed
[ ] Export markdown/json работает или показывает понятную ошибку
[ ] Upload pipeline показывает status steps
[ ] Auth login работает, если AuthPage подключена
[ ] credentials: "include" нигде не используется
```

---

## 24. Проверка backend вручную

Когда backend запущен:

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/scenarios
curl http://127.0.0.1:8000/api/dashboard
```

Search request:

```bash
curl -X POST http://127.0.0.1:8000/api/query \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"скорость циркуляции католита при электроэкстракции никеля\"}"
```

В Windows/Git Bash русская кириллица в `curl -d` может искажаться шеллом. Если ответ выглядит битым, лучше отправлять JSON из UTF-8 файла через `--data-binary @file.json`.

---

## 25. Known risks

### Large JS chunk warning

Vite может предупреждать о большом JS chunk из-за React Flow / graph rendering. Это не ломает build.

Позже можно вынести граф в lazy chunk:

```text
perf: lazy load knowledge graph
```

### Backend может быть в mock mode

Если большого SQLite-индекса нет, backend отдаёт mock-данные. Это нормально: форма ответа такая же.

### `sourceRef` у graph edge может быть `null`

Это ожидаемое поведение для части mock-графа. UI должен показывать нейтральный fallback.

### PDF export может быть заглушкой

Текущий backend может отдавать JSON для `format: "pdf"`. В UI лучше пометить PDF как beta или временно отключить.

### Старые pure RAG endpoint'ы

Старые endpoint'ы:

```text
GET /api/demo/{scenario}
POST /api/search
```

не являются главным контрактом frontend после app-level интеграции. Использовать их только как legacy/compatibility fallback, если это явно нужно.

---

## 26. Git workflow

Перед коммитом:

```bash
npm run build
git status
```

Коммит после обновления README:

```bash
git add README.md
git commit -m "docs: update frontend backend integration guide"
```

Если обновляешь env-шаблон:

```bash
git add .env.example .gitignore
git commit -m "chore: update frontend env example"
```

Если `.env.local` случайно попал в Git:

```bash
git rm --cached .env.local
git add .gitignore
git commit -m "chore: stop tracking local env file"
```

---

## 27. Сообщение для backend-разработчика

Frontend сейчас ожидает app-level API:

```text
GET  /api/health
GET  /api/scenarios
POST /api/query
GET  /api/dashboard
GET  /api/graph
GET  /api/sources
GET  /api/contradictions
GET  /api/gaps
POST /api/reports/export
POST /api/documents/upload
GET  /api/documents/{documentId}/status
GET  /api/documents/{documentId}/extraction
POST /api/auth/login
GET  /api/auth/me
```

Главный контракт:

```text
SearchResult = parsedQuery + answer + evidence + graph + gaps + contradictions + sources + queryId + mode
```

Критично:

```text
- sourceName/page/chunkId/documentId не терять;
- sourceRef может быть null;
- CORS без credentials;
- /api/query должен работать и в rag, и в mock mode;
- /api/health должен возвращать engine: rag | mock.
```

---

## 28. Product language

Не использовать старое позиционирование:

```text
RLM
Ask RLM
Research Learning Memory
generic chat
simple document Q&A
```

Правильная терминология:

```text
Научный клубок
evidence-first dashboard
SearchResult
claim
evidence
source reference
confidence
knowledge graph
contradiction
knowledge gap
numeric condition
export report
```
