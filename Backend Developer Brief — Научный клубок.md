# Backend Developer Brief — проект «Научный клубок»

## 1. Кратко о продукте

**«Научный клубок»** — это evidence-first платформа для работы с научно-техническими знаниями в R&D горно-металлургической отрасли.

Платформа помогает специалистам работать с:

- научными статьями;
- патентами;
- внутренними отчётами;
- экспериментальными данными;
- технологическими справочниками;
- производственными и исследовательскими материалами.

Главная идея продукта:

> **No source — no factual claim.**  
> Если у утверждения нет источника, страницы / чанка и уровня достоверности, оно не должно подаваться как факт.

Платформа **не должна быть обычным чат-ботом по документам**. Пользователь должен видеть не просто текстовый ответ, а проверяемую доказательную структуру:

```text
запрос пользователя
→ parsed query
→ найденные claims
→ evidence table
→ источники
→ confidence
→ граф связей
→ противоречия
→ пробелы
→ экспортируемый отчёт
```

---

## 2. Что платформа должна делать

### 2.1. Принимать научно-технический запрос

Пользователь задаёт сложный вопрос на естественном языке, например:

```text
Какие методы обессоливания воды подходят для обогатительной фабрики,
если исходная вода содержит сульфаты, хлориды, Ca, Mg, Na по 200–300 мг/л,
а требуемый сухой остаток — ≤1000 мг/дм³?
```

Backend должен не просто искать похожий текст, а извлекать из запроса структуру:

- intent / цель запроса;
- материалы;
- процессы;
- технологии;
- параметры;
- числовые условия;
- ограничения;
- временной диапазон;
- географию;
- требуемые свойства / эффекты.

Пример parsed query:

```json
{
  "intent": "technology_selection",
  "materials": ["сульфаты", "хлориды", "Ca", "Mg", "Na"],
  "processes": ["обессоливание воды", "водоподготовка"],
  "technologies": [],
  "properties": ["сухой остаток"],
  "conditions": [
    {
      "name": "концентрация солей",
      "operator": "range",
      "min": 200,
      "max": 300,
      "unit": "мг/л",
      "rawValue": "200–300 мг/л"
    },
    {
      "name": "сухой остаток",
      "operator": "lte",
      "value": 1000,
      "unit": "мг/дм³",
      "rawValue": "≤1000 мг/дм³"
    }
  ],
  "geography": "all",
  "timeRange": null
}
```

---

### 2.2. Искать не только документы, а claims

Центральная сущность системы — **claim**.

Claim — это проверяемое научно-техническое утверждение, извлечённое из источника.

Пример claim:

```text
Скорость циркуляции католита 0,3–0,5 м/с снижает концентрационную поляризацию
при электроэкстракции никеля.
```

Backend должен хранить claim как структурированный объект:

```json
{
  "claimId": "claim_001",
  "text": "Скорость циркуляции католита 0,3–0,5 м/с снижает концентрационную поляризацию при электроэкстракции никеля.",
  "materials": ["никель", "католит"],
  "process": "электроэкстракция никеля",
  "technology": "циркуляция католита",
  "equipment": ["ванна электроэкстракции"],
  "conditions": [
    {
      "name": "скорость потока",
      "operator": "range",
      "min": 0.3,
      "max": 0.5,
      "unit": "м/с",
      "rawValue": "0,3–0,5 м/с"
    }
  ],
  "effect": {
    "property": "концентрационная поляризация",
    "direction": "decrease",
    "description": "снижает концентрационную поляризацию"
  },
  "source": {
    "documentId": "doc_014",
    "chunkId": "doc_014_p12_c03",
    "sourceName": "nickel_electrowinning_review.pdf",
    "page": 12
  },
  "confidence": "high",
  "geography": "foreign",
  "year": 2022
}
```

---

### 2.3. Возвращать evidence-first ответ

Ответ backend должен быть не свободным текстом, а структурой `SearchResult`.

Frontend будет строить интерфейс вокруг этого объекта.

Базовый контракт:

```ts
type SearchResult = {
  parsedQuery: ParsedQuery;
  answer: AnswerSummary;
  evidence: EvidenceClaim[];
  graph: KnowledgeGraph;
  gaps: KnowledgeGap[];
  contradictions: Contradiction[];
  sources: SourceRef[];
};
```

Backend должен возвращать:

- как система поняла запрос;
- краткий вывод;
- таблицу доказательств;
- источники;
- граф связей;
- противоречия;
- пробелы;
- confidence;
- ограничения ответа.

---

## 3. Как платформа выглядит для работника

Пользователь не должен видеть внутреннюю сложность RAG, embeddings, graph database или LLM pipeline.

Для него платформа выглядит как **научно-технический рабочий стол**:

```text
Dashboard
→ Evidence Search
→ Evidence Table
→ Knowledge Graph
→ Sources
→ Contradictions & Gaps
→ Export Report
```

### 3.1. Dashboard

Dashboard показывает общее состояние evidence index:

- сколько документов проиндексировано;
- сколько claims извлечено;
- сколько source references доступно;
- сколько связей построено в графе;
- сколько найдено противоречий;
- сколько найдено пробелов;
- средний confidence;
- последние добавленные claims;
- приоритетные gaps.

Цель Dashboard:

> за 30 секунд показать работнику, что система не просто хранит файлы, а накапливает проверяемые знания.

---

### 3.2. Evidence Search

Это главный экран продукта.

Пользователь задаёт вопрос, а система показывает:

1. **Как система поняла запрос**  
   Материалы, процессы, технологии, условия, ограничения, временной диапазон.

2. **Краткий вывод**  
   Сжатый ответ с confidence и объяснением, почему confidence именно такой.

3. **Таблица доказательств**  
   Главный блок интерфейса. Здесь видны claims, условия, эффекты, источники, страницы и confidence.

4. **Граф связей**  
   Связи между материалами, процессами, технологиями, параметрами, эффектами и источниками.

5. **Источники**  
   Список документов, страниц, чанков и выдержек.

6. **Противоречия**  
   Система показывает, где источники дают разные выводы.

7. **Пробелы**  
   Система показывает, где данных мало или нет.

8. **Экспорт отчёта**  
   Пользователь скачивает evidence report.

---

### 3.3. Knowledge Graph

Граф должен помогать работнику понять связи:

```text
material → process → technology → condition → effect → source
```

Примеры узлов:

- материал: никель, католит, Au, Ag, МПГ, шлак;
- процесс: электроэкстракция, обессоливание, распределение металлов;
- технология: обратный осмос, ионный обмен, циркуляция католита;
- условие: 0,3–0,5 м/с, 200–300 мг/л, ≤1000 мг/дм³;
- эффект: снижение поляризации, достижение сухого остатка, изменение распределения металлов;
- источник: статья, патент, отчёт, эксперимент;
- contradiction;
- knowledge gap.

Граф не должен быть декоративным. Он должен объяснять, **почему система сделала вывод**.

---

### 3.4. Sources

Работник должен иметь возможность проверить источник.

Источник должен содержать:

- id;
- title;
- type;
- year;
- language;
- geography;
- authors;
- reliability;
- excerpt;
- url / file reference;
- связанные claims.

Источник нужен не просто как список литературы, а как доказательная база для claims.

---

### 3.5. Contradictions & Gaps

Платформа должна явно показывать:

- где источники противоречат друг другу;
- какие условия отличаются;
- где данных недостаточно;
- какие комбинации материал + процесс + условие не покрыты источниками;
- какие исследования стоит провести дальше.

Пример contradiction:

```text
Источник A указывает, что скорость католита 0,3–0,5 м/с снижает концентрационную поляризацию.
Источник B указывает, что при повышенной скорости возможно ухудшение стабильности осадка.

Возможная причина: разные составы электролита и разные режимы электроэкстракции.
```

Пример gap:

```text
Не найдено достаточно источников за последние 5 лет по распределению МПГ
между никелевым штейном и шлаком при заданных температурных условиях.
```

---

### 3.6. Export Report

Пользователь должен иметь возможность экспортировать отчёт.

Минимальные форматы для MVP:

- Markdown;
- JSON.

PDF можно оставить как future backend option.

Отчёт должен включать:

- исходный запрос;
- parsed query;
- краткий вывод;
- confidence;
- evidence table;
- источники;
- противоречия;
- пробелы;
- timestamp генерации;
- опционально граф.

---

## 4. Как платформа помогает работнику

### 4.1. Ускоряет поиск технических решений

Обычный поиск возвращает документы.  
«Научный клубок» должен возвращать **структурированные claims с источниками**.

Работник быстрее понимает:

- какие технологии подходят;
- при каких условиях они применимы;
- какие есть ограничения;
- какие источники это подтверждают.

---

### 4.2. Снижает риск ошибочных выводов

Платформа не должна скрывать неопределённость.

Она обязана показывать:

- confidence;
- слабую доказательную базу;
- противоречащие источники;
- неполное покрытие;
- устаревшие или нерелевантные данные.

Это особенно важно для R&D и промышленной тематики, где неправильный вывод может привести к неверному технологическому решению.

---

### 4.3. Показывает, что именно известно

Система должна отвечать на вопрос:

```text
Что у нас уже подтверждено источниками?
```

Для этого backend должен хранить и возвращать:

- claims;
- source references;
- conditions;
- effects;
- graph relations;
- confidence.

---

### 4.4. Показывает, что неизвестно

Система также должна отвечать на вопрос:

```text
Где у нас пробелы в знаниях?
```

Backend должен уметь формировать gaps:

- нет источников по комбинации material + process;
- мало свежих источников;
- нет числовых параметров;
- нет данных по конкретной географии;
- нет экспериментов за нужный период;
- данные есть, но confidence низкий.

---

### 4.5. Помогает готовить отчёты

Результат работы должен быть экспортируемым.

Это важно, потому что работник должен не просто посмотреть ответ, а использовать его:

- в обсуждении с командой;
- в техническом отчёте;
- в презентации;
- в планировании эксперимента;
- в сравнении технологических вариантов.

---

## 5. Главные demo scenarios

Backend и frontend должны поддерживать три сценария. На них строится демо.

---

### 5.1. Сценарий 1 — обессоливание воды

Запрос:

```text
Какие методы обессоливания воды подходят для обогатительной фабрики,
если исходная вода содержит сульфаты, хлориды, Ca, Mg, Na по 200–300 мг/л,
а требуемый сухой остаток — ≤1000 мг/дм³?
```

Backend должен показать:

- parsed query с числовыми условиями;
- методы водоподготовки / обессоливания;
- evidence claims;
- источники;
- условия применимости;
- ограничения;
- confidence;
- gaps, если данных недостаточно.

Ключевая демонстрационная ценность:

> система учитывает числовые условия, а не просто ищет похожий текст.

---

### 5.2. Сценарий 2 — циркуляция католита

Запрос:

```text
Какие технические решения организации циркуляции католита при электроэкстракции никеля
описаны в мировой практике, и какая скорость потока считается оптимальной?
```

Backend должен показать:

- технологии циркуляции католита;
- диапазоны скорости потока;
- оборудование;
- параметры;
- effects;
- источники;
- возможные противоречия;
- graph relations.

Ключевая демонстрационная ценность:

> система связывает процесс, параметр, эффект и источник в граф.

---

### 5.3. Сценарий 3 — Au / Ag / МПГ

Запрос:

```text
Покажите все эксперименты и публикации по распределению Au, Ag и МПГ
между медным/никелевым штейном и шлаком за последние 5 лет.
```

Backend должен показать:

- фильтр по последним 5 годам;
- Au, Ag, МПГ;
- медный штейн;
- никелевый штейн;
- шлак;
- публикации;
- эксперименты;
- gaps;
- слабое покрытие, если данных мало;
- источники.

Ключевая демонстрационная ценность:

> система ищет по нескольким сущностям и показывает пробелы в покрытии.

---

## 6. Backend pipeline

Рекомендуемый backend pipeline:

```text
raw documents
→ ingestion
→ parsing
→ chunking
→ source references
→ entity extraction
→ numeric condition extraction
→ claim extraction
→ relation extraction
→ indexing
→ retrieval
→ graph expansion
→ contradiction detection
→ gap detection
→ answer synthesis
→ SearchResult
```

---

### 6.1. Ingestion

Backend должен принимать документы:

- pdf;
- docx;
- txt;
- csv;
- xlsx.

На MVP достаточно поддержать ограниченный набор форматов, но frontend-контракт должен быть готов к нескольким типам.

Результат ingestion:

```json
{
  "documentId": "doc_001",
  "title": "Nickel electrowinning catholyte circulation review",
  "fileName": "nickel_catholyte_review.pdf",
  "fileType": "pdf",
  "status": "processed",
  "uploadedAt": "2026-07-03T09:00:00Z"
}
```

---

### 6.2. Chunking

Каждый chunk должен иметь:

- chunkId;
- documentId;
- page;
- text;
- section title, если доступно;
- source reference.

Важно: claim должен ссылаться не только на документ, но и на конкретный chunk / page.

---

### 6.3. Entity extraction

Из текста нужно извлекать:

- materials;
- processes;
- technologies;
- equipment;
- parameters;
- properties;
- effects;
- organizations / labs / experts, если есть.

---

### 6.4. Numeric condition extraction

Это одна из главных ценностей.

Backend должен уметь извлекать:

- диапазоны;
- ≤ / ≥;
- единицы измерения;
- нормализованные значения;
- raw text;
- связь условия с claim.

Пример:

```json
{
  "name": "скорость потока",
  "operator": "range",
  "min": 0.3,
  "max": 0.5,
  "unit": "м/с",
  "rawValue": "0,3–0,5 м/с"
}
```

---

### 6.5. Claim extraction

Claim должен быть максимально проверяемым:

```text
при таких условиях → для такого процесса → наблюдается такой эффект → источник такой-то
```

Плохой claim:

```text
Обратный осмос эффективен.
```

Хороший claim:

```text
Обратный осмос применим для снижения сухого остатка воды до ≤1000 мг/дм³
при предварительном удалении взвесей и контроле солесодержания.
```

---

### 6.6. Relation extraction

Backend должен строить связи:

```text
claim supports source
claim mentions material
claim applies_to process
claim has_condition condition
claim has_effect effect
claim uses_technology technology
claim uses_equipment equipment
claim contradicts claim
claim has_gap gap
```

---

### 6.7. Retrieval

Retrieval должен учитывать:

- semantic similarity;
- keyword match;
- extracted entities;
- numeric conditions;
- filters;
- source reliability;
- recency;
- graph neighborhood.

Для MVP можно реализовать упрощённо, но внешний контракт должен оставаться evidence-first.

---

### 6.8. Contradiction detection

Противоречие возникает, когда два claim:

- относятся к похожему материалу / процессу / технологии;
- имеют похожие условия;
- дают разные effects или разные recommendations;
- подтверждаются разными источниками.

Backend должен возвращать contradiction как объект:

```json
{
  "id": "contr_001",
  "title": "Разные оценки оптимальной скорости циркуляции католита",
  "description": "Источники дают разные диапазоны оптимальной скорости при близких условиях электроэкстракции никеля.",
  "sourceA": {
    "documentId": "doc_014",
    "chunkId": "doc_014_p12_c03",
    "sourceName": "nickel_electrowinning_review.pdf",
    "page": 12
  },
  "sourceB": {
    "documentId": "doc_021",
    "chunkId": "doc_021_p08_c02",
    "sourceName": "catholyte_hydrodynamics_study.pdf",
    "page": 8
  },
  "status": "possible"
}
```

---

### 6.9. Gap detection

Gap — это не ошибка. Это полезный сигнал для исследователя.

Backend должен возвращать gaps, если:

- источников мало;
- нет свежих данных;
- нет числовых условий;
- нет экспериментов;
- есть только зарубежные источники;
- есть только общие статьи без конкретных параметров;
- нет данных по нужной комбинации material + process + condition.

---

## 7. API endpoints для MVP

Ниже — рекомендуемые endpoints. Их можно реализовывать постепенно.

---

### 7.1. Query

```http
POST /api/query
```

Request:

```ts
type QueryRequest = {
  query: string;
  filters?: {
    material?: string;
    process?: string;
    geography?: "domestic" | "foreign" | "all";
    yearFrom?: number;
    yearTo?: number;
    confidence?: "low" | "medium" | "high";
    sourceTypes?: ("publication" | "report" | "experiment" | "patent" | "standard")[];
  };
};
```

Response:

```ts
type QueryResponse = SearchResult;
```

Это главный endpoint для MVP.

---

### 7.2. Graph

```http
GET /api/graph?topic=...
```

Response:

```ts
type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
```

---

### 7.3. Sources

```http
GET /api/sources
GET /api/sources/:sourceId
```

---

### 7.4. Contradictions

```http
GET /api/contradictions
```

---

### 7.5. Gaps

```http
GET /api/gaps
```

---

### 7.6. Upload

```http
POST /api/documents/upload
GET /api/documents/:documentId/status
GET /api/documents/:documentId/extraction
```

Upload важен, но для frontend MVP он вторичен. Главная демонстрационная ценность — `/api/query`.

---

### 7.7. Export

```http
POST /api/reports/export
```

Request:

```ts
type ExportReportRequest = {
  title: string;
  format: "pdf" | "markdown" | "json";
  queryId?: string;
  includeGraph?: boolean;
  includeSources?: boolean;
  includeContradictions?: boolean;
  includeGaps?: boolean;
};
```

Response:

```ts
type ExportReportResponse = {
  reportId: string;
  downloadUrl: string;
  format: "pdf" | "markdown" | "json";
  createdAt: string;
};
```

---

## 8. Главный контракт для frontend

Frontend будет ожидать объект такого вида:

```ts
type ConfidenceLevel = "high" | "medium" | "low";

type ConditionOperator =
  | "eq"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "range"
  | "unknown";

type Condition = {
  name: string;
  operator: ConditionOperator;
  min?: number | null;
  max?: number | null;
  value?: number | string | null;
  unit?: string | null;
  rawValue: string;
};

type Effect = {
  property: string;
  direction:
    | "increase"
    | "decrease"
    | "improve"
    | "worsen"
    | "no_change"
    | "unknown";
  value?: string | null;
  description: string;
};

type SourceRef = {
  documentId: string;
  chunkId: string;
  sourceName: string;
  page?: number | null;
};

type EvidenceClaim = {
  claimId: string;
  text: string;
  materials: string[];
  process?: string | null;
  technology?: string | null;
  equipment: string[];
  conditions: Condition[];
  effect?: Effect | null;
  source: SourceRef;
  confidence: ConfidenceLevel;
  geography: "domestic" | "foreign" | "mixed" | "unknown";
  year?: number | null;
};

type ParsedQuery = {
  intent: string;
  materials: string[];
  processes: string[];
  technologies: string[];
  properties: string[];
  conditions: Condition[];
  geography?: "domestic" | "foreign" | "mixed" | "unknown" | "all";
  timeRange?: {
    from?: number | null;
    to?: number | null;
  } | null;
};

type AnswerSummary = {
  shortConclusion: string;
  recommendation?: string | null;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  warnings: string[];
};

type GraphNode = {
  id: string;
  label: string;
  type:
    | "claim"
    | "material"
    | "process"
    | "technology"
    | "equipment"
    | "condition"
    | "effect"
    | "source"
    | "contradiction"
    | "gap";
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relation: string;
};

type KnowledgeGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type KnowledgeGap = {
  id: string;
  title: string;
  description: string;
  type:
    | "weak_coverage"
    | "missing_combination"
    | "missing_numeric_data"
    | "missing_recent_sources";
  severity: "info" | "warning";
};

type Contradiction = {
  id: string;
  title: string;
  description: string;
  sourceA: SourceRef;
  sourceB: SourceRef;
  status: "possible" | "confirmed" | "needs_review";
};

type SearchResult = {
  parsedQuery: ParsedQuery;
  answer: AnswerSummary;
  evidence: EvidenceClaim[];
  graph: KnowledgeGraph;
  gaps: KnowledgeGap[];
  contradictions: Contradiction[];
  sources: SourceRef[];
};
```

Backend должен стараться не менять этот контракт без согласования с frontend.

---

## 9. Что backend не должен делать

### 9.1. Не возвращать неподтверждённые факты

Плохо:

```json
{
  "summary": "Обратный осмос подходит лучше всего."
}
```

Хорошо:

```json
{
  "answer": {
    "shortConclusion": "Обратный осмос может быть применим при предварительной подготовке воды, но требуется проверка состава и режима эксплуатации.",
    "confidence": "medium",
    "confidenceReason": "Найдено несколько источников по снижению сухого остатка, но мало данных по конкретной комбинации сульфаты + хлориды + Ca/Mg/Na."
  },
  "evidence": [
    {
      "claimId": "claim_001",
      "text": "...",
      "source": {
        "documentId": "doc_001",
        "chunkId": "doc_001_p04_c02",
        "sourceName": "water_treatment_review.pdf",
        "page": 4
      },
      "confidence": "medium"
    }
  ]
}
```

---

### 9.2. Не скрывать uncertainty

Если данных мало, backend должен возвращать:

- `confidence: "low"` или `"medium"`;
- warnings;
- gaps;
- partial answer.

---

### 9.3. Не смешивать разные уровни данных

Нужно различать:

- документ;
- chunk;
- claim;
- source reference;
- answer summary;
- graph node;
- graph edge;
- gap;
- contradiction.

---

### 9.4. Не использовать старую RLM-терминологию

В новых API и UI лучше избегать:

- RLM;
- Ask RLM;
- Research Learning Memory;
- Research Memory updated.

Использовать:

- «Научный клубок»;
- evidence index;
- evidence search;
- claims;
- source references;
- knowledge graph;
- contradictions;
- knowledge gaps;
- evidence report.

---

## 10. Backend MVP priority

Самый правильный порядок реализации backend:

```text
1. Static/mock SearchResult endpoint for 3 demo scenarios
2. SourceRef and EvidenceClaim schema
3. /api/query with demo routing by query text or scenarioId
4. /api/graph from existing mock graph
5. /api/sources
6. /api/contradictions and /api/gaps
7. Export JSON/Markdown
8. Document upload mock
9. Real ingestion/parsing
10. Real retrieval and claim extraction
```

Для frontend-разработки на первом этапе достаточно, чтобы backend умел отдавать стабильный `SearchResult`.

---

## 11. Minimal backend для первого демо

Минимально нужно реализовать:

```http
POST /api/query
```

Request:

```json
{
  "query": "Какие методы обессоливания воды подходят...",
  "scenarioId": "desalination"
}
```

Response:

```json
{
  "parsedQuery": {},
  "answer": {},
  "evidence": [],
  "graph": {
    "nodes": [],
    "edges": []
  },
  "gaps": [],
  "contradictions": [],
  "sources": []
}
```

Даже если внутри пока mock, frontend уже сможет показать полноценный demo-flow.

---

## 12. Definition of Done для backend-задачи

Backend-задача считается готовой, если:

- endpoint работает локально;
- ответ валидируется по TypeScript/JSON schema контракту;
- нет неподтверждённых фактов без source reference;
- каждый claim имеет source reference;
- каждый claim имеет confidence;
- numeric conditions сохраняют rawValue и normalized поля, если доступны;
- contradictions и gaps возвращаются отдельными массивами;
- frontend может подключиться без изменения UI-структуры;
- demo scenarios возвращают стабильный результат;
- API не использует старую RLM-терминологию.

---

## 13. Главное для backend-разработчика

Backend в этом проекте — это не просто слой, который отдаёт текстовый ответ LLM.

Backend должен быть **evidence engine**:

```text
источники
→ claims
→ условия
→ связи
→ граф
→ contradictions
→ gaps
→ evidence-backed answer
```

Frontend будет красивым dashboard, но ценность продукта появляется только тогда, когда backend возвращает проверяемую структуру.

Главное правило:

> Каждый вывод должен быть связан с источником, условием, confidence и объяснимым местом в evidence graph.
