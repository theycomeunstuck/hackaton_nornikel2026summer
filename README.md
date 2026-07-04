# Научный клубок — Frontend

Frontend для hackathon MVP **«Научный клубок»** — evidence-first интерфейс для работы с научно-техническими источниками, RAG-результатами, графом знаний, пробелами и возможными противоречиями.

Проект работает в двух режимах:

1. **Offline demo mode** — без backend, через локальные `sample_*_server.json`.
2. **RAG API mode** — через backend endpoint'ы `/api/demo/*` и `/api/search`.

Главный принцип интерфейса:

> Нет источника — нет фактического утверждения.

Поэтому основной экран строится не как chatbot, а как **evidence dashboard**: parsed query, answer summary, evidence table, sources, knowledge graph, gaps и contradictions.

---

## Текущий статус frontend

Реализовано:

- TypeScript-контракт `SearchResult`;
- RAG API client с mock fallback;
- demo scenarios:
  - `desalination`;
  - `catholyte`;
  - `pgm`;
- SearchPage с evidence-first flow;
- AnswerSummaryCard;
- ParsedQueryCard;
- EvidenceTable;
- SourcesPanel;
- GapsPanel;
- ContradictionsPanel;
- KnowledgeGraph;
- loading / empty / error states;
- отображение `sourceName`, `page`, `chunkId`, `documentId`;
- работа без backend через local samples.

---

## Стек

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Flow
- mock-first RAG integration

---

## Установка

```bash
npm install
```

---

## Запуск frontend

```bash
npm run dev
```

По умолчанию frontend может работать без backend: если API недоступен, `ragApi` вернёт local sample данные.

---

## Сборка

```bash
npm run build
```

Проверка preview build:

```bash
npm run preview
```

---

## ENV

Создай файл `.env.local` в корне frontend-проекта:

```env
# RAG backend base URL.
# Если backend недоступен, frontend использует local sample_*_server.json fallback.
VITE_RAG_BASE_URL=http://localhost:8000
```

Для примера можно хранить `.env.example`:

```env
# RAG backend base URL.
# Local backend default:
VITE_RAG_BASE_URL=http://localhost:8000
```

Важно: переменные Vite, доступные в браузере, должны начинаться с `VITE_`.

---

## RAG API contract

Frontend ожидает backend, который возвращает один объект `SearchResult`.

Верхний уровень ответа всегда содержит 7 ключей:

```ts
{
  parsedQuery,
  answer,
  evidence,
  graph,
  gaps,
  contradictions,
  sources
}
```

### Expected backend endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Проверка доступности backend |
| `GET` | `/api/stats` | Статистика индекса |
| `GET` | `/api/demo/desalination` | Demo scenario: обессоливание воды |
| `GET` | `/api/demo/catholyte` | Demo scenario: циркуляция католита |
| `GET` | `/api/demo/pgm` | Demo scenario: Au / Ag / МПГ, штейн и шлак |
| `POST` | `/api/search` | Пользовательский поиск |

Пример запроса:

```ts
await fetch(`${baseUrl}/api/search`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Какая скорость потока католита оптимальна при электроэкстракции никеля?',
    topK: 15,
  }),
});
```

---

## SearchResult structure

### `parsedQuery`

Показывает, как система поняла запрос:

- `intent`;
- `materials`;
- `processes`;
- `technologies`;
- `properties`;
- `conditions`;
- `geography`;
- `timeRange`.

### `answer`

Краткий evidence-based summary:

- `shortConclusion`;
- `confidence`;
- `confidenceReason`;
- `warnings`;
- `numericMode`.

Важно: `answer.shortConclusion` может быть длинным, поэтому UI показывает preview и кнопку «Показать полностью».

### `evidence`

Главный блок результата. Каждая строка содержит:

- `text`;
- `score`;
- `confidence`;
- `conditions`;
- `matchedTerms`;
- `numericStatus`;
- `source`.

Обязательные source поля в UI:

- `sourceName`;
- `page`;
- `chunkId`;
- `documentId`.

### `graph`

Knowledge graph по найденным evidence chunks:

- `nodes`: `id`, `label`, `type`;
- `edges`: `id`, `source`, `target`, `relation`, `sourceRef`, `evidenceText`.

Каждое graph edge должно сохранять `sourceRef`.

### `gaps`

Пробелы знания:

- `knowledge_gap`;
- `weak_coverage`;
- `geographic_gap`;
- `evidence_gap`;
- `missing_numeric_data`;
- `missing_combination`.

### `contradictions`

Возможные противоречия. В текущем Mode B backend они эвристические.

UI должен отображать статусы честно:

| Backend status | UI label |
|---|---|
| `possible` | Возможное противоречие |
| `needs_review` | Требует экспертной проверки |
| `confirmed` | Подтверждено |

Не нужно называть `possible` или `needs_review` подтверждёнными противоречиями.

### `sources`

Deduplicated список источников. Используется для SourcesPanel.

---

## Offline demo samples

Frontend хранит local samples:

```text
src/shared/mock/rag/sample_desalination_server.json
src/shared/mock/rag/sample_catholyte_server.json
src/shared/mock/rag/sample_pgm_server.json
```

Они нужны для demo без backend.

`ragApi` работает так:

1. Пытается обратиться к backend.
2. Если backend недоступен, возвращает local sample.
3. Для пользовательского поиска выбирает sample по эвристике:
   - вода / обессоливание / сухой остаток → `desalination`;
   - католит / никель / электроэкстракция → `catholyte`;
   - Au / Ag / МПГ / PGM / штейн / шлак → `pgm`.

---

## Важные frontend-файлы

```text
src/shared/types/rag.ts
src/shared/api/ragApi.ts
src/shared/api/ragResultAdapter.ts
src/shared/mock/rag/
src/widgets/result/EvidenceTable.tsx
src/widgets/result/AnswerSummaryCard.tsx
src/widgets/result/SourcesPanel.tsx
src/widgets/result/GapsPanel.tsx
src/widgets/result/ContradictionsPanel.tsx
src/widgets/result/ParsedQueryCard.tsx
src/widgets/graph/KnowledgeGraph.tsx
```

Названия некоторых файлов могут отличаться в зависимости от текущей структуры проекта, но смысловой слой должен оставаться таким.

---

## Как подключить реальный backend

1. Запустить backend на `http://localhost:8000`.
2. Создать `.env.local`:

```env
VITE_RAG_BASE_URL=http://localhost:8000
```

3. Перезапустить Vite dev server:

```bash
npm run dev
```

4. Проверить:

```text
GET  http://localhost:8000/api/health
GET  http://localhost:8000/api/demo/desalination
POST http://localhost:8000/api/search
```

Если backend упал или недоступен, frontend не должен падать: он вернётся к mock fallback.

---

## Demo сценарии

### 1. Обессоливание воды

Фокус:

- sulfates;
- chlorides;
- calcium;
- magnesium;
- sodium;
- dry residue;
- numeric conditions;
- technology selection.

Лучше всего демонстрирует:

- ParsedQueryCard;
- numeric conditions;
- EvidenceTable;
- GapsPanel.

### 2. Циркуляция католита

Фокус:

- nickel electrowinning;
- catholyte circulation;
- flow rate;
- process parameters;
- sourced graph.

Лучше всего демонстрирует:

- KnowledgeGraph;
- SourcesPanel;
- EvidenceTable.

### 3. Au / Ag / МПГ между штейном и шлаком

Фокус:

- precious metals;
- platinum group metals;
- matte;
- slag;
- distribution / recovery;
- time range 2021–2026.

Лучше всего демонстрирует:

- parsed timeRange;
- multi-entity query;
- sources by year;
- graph and evidence.

---

## Manual QA checklist

Перед push проверь:

```text
[ ] npm run build проходит
[ ] frontend запускается без backend
[ ] desalination demo работает
[ ] catholyte demo работает
[ ] pgm demo работает
[ ] пользовательский search работает через fallback
[ ] EvidenceTable показывает sourceName/page/chunkId/documentId
[ ] SourcesPanel показывает sourceName/page/chunkId/documentId
[ ] KnowledgeGraph edge details показывает sourceRef
[ ] long answer не ломает layout
[ ] long evidence text открывается через modal/details
[ ] loading state есть
[ ] empty state есть
[ ] error state есть
[ ] possible/needs_review не называются confirmed
```

---

## Known frontend risks

### Large JS chunk warning

Vite может предупреждать о большом JS chunk из-за React Flow / graph rendering.

Это не ломает build. Позже можно вынести граф в lazy chunk:

```text
perf: lazy load RAG knowledge graph
```

### Backend ещё может измениться

Frontend защищён через `ragApi` и mock fallback. Если backend изменит endpoint или shape ответа, сначала нужно обновлять:

```text
src/shared/types/rag.ts
src/shared/api/ragApi.ts
src/shared/api/ragResultAdapter.ts
```

а не переписывать SearchPage.

---

## Git commit examples

```bash
git add .
git commit -m "docs: document RAG frontend integration"
```

Если добавляешь `.env.example`:

```bash
git add .env.example
git commit -m "chore: add RAG backend env example"
```

---

## Для backend-разработчика

Frontend ожидает:

```text
GET  /api/health
GET  /api/stats
GET  /api/demo/desalination
GET  /api/demo/catholyte
GET  /api/demo/pgm
POST /api/search
```

`POST /api/search` body:

```json
{
  "query": "Какая скорость потока католита оптимальна при электроэкстракции никеля?",
  "topK": 15
}
```

Response: `SearchResult` with exactly these top-level keys:

```json
{
  "parsedQuery": {},
  "answer": {},
  "evidence": [],
  "graph": {},
  "gaps": [],
  "contradictions": [],
  "sources": []
}
```

Главное: не терять source references.

Каждый evidence item должен иметь:

```json
{
  "source": {
    "documentId": "...",
    "sourceName": "...",
    "chunkId": "...",
    "page": 1
  }
}
```

Каждый graph edge должен иметь:

```json
{
  "sourceRef": {
    "documentId": "...",
    "sourceName": "...",
    "chunkId": "...",
    "page": 1
  }
}
```
