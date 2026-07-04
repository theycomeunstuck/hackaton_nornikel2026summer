# API «Научный клубок» (уровень `app`) — для фронтенд-разработчика

Это спецификация HTTP API бэкенда `app/` — того, что поднимается командой
`py run.py`. Бэкенд объединяет реальный GraphRAG-движок (`rag/`) и прикладные
эндпоинты (auth, dashboard, upload, export). Фронтенд строится **против этого
API**.

> Контракт ответа `/api/query` (объект `SearchResult`) детально описан в
> [`rag/docs/API.md`](../rag/docs/API.md). Здесь — все эндпоинты `app` и то, чем
> они отличаются/дополняют RAG-слой.

---

## 1. Как поднять фронт против бэка

```bash
# бэкенд (из корня проекта)
py run.py                              # http://127.0.0.1:8000
py run.py --host 0.0.0.0 --port 8000   # доступен по сети
py run.py --port 8080                  # другой порт
```

- **Base URL:** `http://127.0.0.1:8000`
- **CORS:** открыт для любого origin (`*`), `credentials` **не используются**
  (авторизация через заголовок `Authorization: Bearer <token>`, не через куки).
  → в `fetch` **не ставьте** `credentials: 'include'`.
- **Кодировка:** все ответы `application/json; charset=utf-8`, кириллица не
  экранируется.
- **Swagger/OpenAPI:** `http://127.0.0.1:8000/docs` — интерактивный список
  эндпоинтов.
- Встроенный демо-UI на `/` — необязателен, это референс: показывает, как
  вызывается каждый эндпоинт (см. `static/index.html`).

```js
const BASE = "http://127.0.0.1:8000";

// главный вызов
const res = await fetch(`${BASE}/api/query`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "…", filters: { geography: "foreign" } }),
}).then(r => r.json());
// res -> { parsedQuery, answer, evidence, graph, gaps, contradictions, sources, queryId, mode }
```

### Два режима, ОДИН контракт

Бэкенд работает в одном из режимов, но **форма ответа идентична**:

| Режим | Когда | Поле `mode` | numeric |
|---|---|---|---|
| `rag` | есть индекс `rag/data/index.sqlite` | `"rag"` | `structured`/`approximate` |
| `mock` | индекса нет (demo) | `"mock"` | `approximate`/`none` |

Проверить режим: `GET /api/health` → `{"engine":"rag"|"mock"}`. **Фронтенд можно
разрабатывать в demo-режиме** (без 5.8 ГБ индекса) — контракт тот же.

---

## 2. Главный контракт — `SearchResult`

Объект из 7 ключей + служебные `queryId`, `mode`:

```jsonc
{
  "parsedQuery": {
    "intent": "technology_selection",
    "materials": ["сульфаты", "хлориды"],
    "processes": ["обессоливание воды"],
    "technologies": [],
    "properties": ["сухой остаток"],
    "conditions": [
      { "name": "…", "operator": "range", "min": 200, "max": 300,
        "value": null, "unit": "мг/л", "rawValue": "200–300 мг/л" }
    ],
    "geography": "all",              // all|domestic|foreign|mixed|unknown
    "timeRange": null                // | { "from": 2021, "to": 2026 }
  },
  "answer": {
    "shortConclusion": "…",
    "confidence": "high",            // high|medium|low
    "confidenceReason": "…",
    "warnings": ["…"],
    "numericMode": "structured"      // structured|approximate|none
  },
  "evidence": [
    {
      "id": "ev_…",
      "text": "…",
      "score": 0.98,
      "confidence": "high",
      "conditions": [ /* как в parsedQuery.conditions */ ],
      "matchedTerms": ["никель", "католит"],
      "numericStatus": "structured", // structured|approximate|none|unmatched
      "source": {
        "documentId": "doc_…", "sourceName": "file.pdf", "chunkId": "…",
        "page": 12, "sectionTitle": null, "sourceType": "publication",
        "year": 2022, "geography": "foreign"
      }
    }
  ],
  "graph": {
    "nodes": [ { "id": "…", "label": "…", "type": "material" } ],
    "edges": [ { "id": "…", "source": "…", "target": "…", "relation": "…",
                 "sourceRef": { /* SourceRef|null */ }, "evidenceText": null } ]
  },
  "gaps": [
    { "id": "…", "type": "missing_combination", "title": "…",
      "description": "…", "severity": "warning" }   // info|warning
  ],
  "contradictions": [
    { "id": "…", "title": "…", "description": "…",
      "sourceA": { /* SourceRef */ }, "sourceB": { /* SourceRef */ },
      "status": "possible" }                          // possible|needs_review|confirmed
  ],
  "sources": [ { /* SourceRef, дедуп по documentId+chunkId */ } ],
  "queryId": "q_…",
  "mode": "rag"
}
```

Типы узлов графа: `material | process | technology | equipment | condition |
effect | parameter | experiment | source | contradiction | gap` (набор может
расширяться — рендерите по словарю цветов, неизвестный тип → нейтральный).

---

## 3. Эндпоинты

### Поиск и evidence

#### `POST /api/query` — **главный**
Request:
```ts
{
  query: string;                     // обязательно
  scenarioId?: string;               // необязательно (mock-подсказка)
  filters?: {
    material?: string;
    process?: string;
    geography?: "domestic" | "foreign" | "russia" | "all";
    yearFrom?: number;
    yearTo?: number;
    confidence?: "low" | "medium" | "high";
    sourceTypes?: ("publication"|"report"|"experiment"|"patent"|"standard")[];
  };
}
```
Response: `SearchResult` (см. §2). В RAG-режиме жёстко фильтруются
`geography`/`yearFrom`/`yearTo`/`sourceTypes`; `confidence` отсекается на выдаче.

#### `GET /api/graph?topic=<строка>`
Граф знаний. С `topic` — по конкретному запросу; без него — объединённый обзор.
Ответ: `{ nodes, edges }` (как `SearchResult.graph`).

#### `GET /api/sources`
Список источников (форма `SourceRef` в RAG-режиме; в mock — расширенный `Source`
с `title/authors/reliability/excerpt`). Параметры (опц.): `geography`, `type`,
`year_from`, `year_to`.

#### `GET /api/sources/{sourceId}`
Один источник (mock-каталог). В RAG-режиме используйте список.

#### `GET /api/contradictions` → `Contradiction[]`
#### `GET /api/gaps` → `KnowledgeGap[]`

### Дашборд и статистика

#### `GET /api/dashboard`
```jsonc
{
  "mode": "rag",
  "cards": [ { "label": "Чанков в индексе", "value": 441714 }, … ],
  "indexStats": { "chunk_count": "…", "relation_count": "…",
                  "parameter_count": "…", "has_parameters": "1" },
  "domainsCoverage": { "hydrometallurgy": 15, "ecology": 15,
                       "pyrometallurgy": 12, "waste_processing": 0 },
  "priorityGaps": [ /* KnowledgeGap[] severity=warning */ ],
  "recentClaims": [ /* evidence-элементы */ ]
}
```
Рендерите карточки из `cards` (label/value) — набор карточек может отличаться в
rag/mock.

#### `GET /api/stats`
`{ "mode": "rag", "chunk_count": "441714", … }` — сырые числа индекса (строки).

#### `GET /api/health`
`{ "status": "ok", "service": "…", "version": "…", "engine": "rag"|"mock" }`

#### `GET /api/scenarios`
3 демо-запроса для кнопок-примеров: `[{ id, title, query }]`.

### Экспорт отчёта

#### `POST /api/reports/export`
Request:
```ts
{
  title: string;
  format: "markdown" | "json" | "pdf";   // pdf отдаётся как json (заглушка)
  queryId?: string;      // сюда можно передать ТЕКСТ запроса (перезапустится)
  includeGraph?: boolean; includeSources?: boolean;
  includeContradictions?: boolean; includeGaps?: boolean;
}
```
Response: `{ reportId, downloadUrl, format, createdAt }`.
Затем `GET {downloadUrl}` → файл отчёта (attachment).

### Документы (ingestion, mock-pipeline)

- `POST /api/documents/upload` (multipart: `file`, опц. `title`) →
  `{ documentId, title, fileName, fileType, status, uploadedAt }`
- `GET /api/documents/{id}/status` → `{ documentId, status, steps:[{id,name,description,status}] }`
  (шаги прогрессируют во времени: `pending → running → done`)
- `GET /api/documents/{id}/extraction` → `{ entities, parameters, conclusions, relations }`

### Авторизация (демо)

Большинство эндпоинтов **не требуют** авторизации. Auth — демонстрационный:

- `POST /api/auth/login` `{ email, password }` → `{ accessToken, user:{id,name,role,organization} }`
  (роль определяется по префиксу email: `admin@…`, `manager@…`, `analyst@…`, иначе `researcher`)
- `GET /api/auth/me` (заголовок `Authorization: Bearer <token>`) → `{ id, name, email, role }`

---

## 4. Ошибки

Стандарт FastAPI: HTTP-код + `{ "detail": "<сообщение>" }`.
Примеры: `401` (нет/битый токен на `/api/auth/me`), `404` (нет источника/отчёта),
`422` (пустой `query` или невалидное тело).

---

## 5. Чек-лист интеграции

- [ ] Base URL вынесен в конфиг фронта (`http://127.0.0.1:8000`).
- [ ] В `fetch` **нет** `credentials:'include'`.
- [ ] UI строится вокруг `SearchResult` (§2), поля читаются с защитой от `null`.
- [ ] Проверено в demo-режиме (без индекса) и в RAG-режиме — форма одна.
- [ ] Узлы графа рендерятся по словарю типов, неизвестный тип не роняет UI.
- [ ] `answer.warnings` / `gaps` / `contradictions` показываются (не скрывать
      неопределённость — это ядро продукта).
