# Научный клубок — Evidence Engine


Evidence-first backend + демо-UI для работы с научно-техническими знаниями
горно-металлургической отрасли (хакатон «Научный клубок», задача 2).

> **No source — no factual claim.** Каждый вывод привязан к источнику, условию
> и уровню достоверности. Платформа возвращает не текстовый ответ чат-бота, а
> проверяемую доказательную структуру: parsed query → claims → evidence table →
> источники → confidence → граф → противоречия → пробелы → отчёт.

## 📦 Если вы получили проект архивом — читать первым

1. **Нужен Python 3.13** и (на Windows) launcher `py`. Проверка: `py --version`.
2. **Удалите папку `.venv` из архива, если она там есть.** Виртуальное окружение
   привязано к машине автора (внутри абсолютные пути `C:\Users\...`) и на другом
   компьютере не работает — его нужно создать заново (шаг «Быстрый старт» ниже).
3. **Проверьте индекс.** Если в архиве есть `rag/data/index.sqlite` (~5.8 ГБ) —
   система запустится в полном **RAG-режиме**. Если файла нет — автоматически
   включится **demo-режим** (mock-данные), всё остальное работает так же.
4. Дальше — обычный «Быстрый старт»: создать venv, поставить зависимости, запустить.

После запуска откройте <http://127.0.0.1:8000/> — в левом сайдбаре под логотипом
будет видно текущий режим: **«RAG · реальный индекс»** или **«demo (mock)»**.

## Быстрый старт

Проект работает в изолированном виртуальном окружении (`.venv`), чтобы не
засорять глобальный Python. Интерпретатор запускается через launcher `py`
(на Windows `python` — это стаб из WindowsApps, использовать именно `py`).

### 1. Создать venv и установить зависимости (один раз)

```bash
py -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
```

### 2. Запустить сервер

**Вариант A — с активацией окружения:**

```bash
source .venv/Scripts/activate     # bash (Git Bash)
# .venv\Scripts\activate          # cmd / PowerShell
python run.py                     # http://127.0.0.1:8000
python run.py --reload            # с автоперезагрузкой при изменениях
deactivate                        # выйти из окружения
```

**Вариант B — без активации, напрямую через интерпретатор venv:**

```bash
.venv/Scripts/python.exe run.py
# или: .venv/Scripts/python.exe -m uvicorn app.main:app --reload
```

- Демо-интерфейс: <http://127.0.0.1:8000/>
- Swagger / OpenAPI: <http://127.0.0.1:8000/docs>

> `.venv/` добавлена в `.gitignore` и в репозиторий не попадает.
> Проверить, что зависимость реально из venv:
> `.venv/Scripts/python.exe -c "import fastapi; print(fastapi.__file__)"`
> — путь должен вести в `.venv`.

## Единый механизм: app + RAG

Бэкенд `app/` работает поверх реального **GraphRAG-движка** `rag/` как единая
система. `/api/query` и связанные эндпоинты обслуживаются движком
`rag.retrieval.pipeline.Engine` над пребилт-индексом `rag/data/index.sqlite`
(441k чанков, 2.6M связей, 696k числовых параметров → числовая фильтрация
**structured**, claim-grade).

```
app (FastAPI + UI, auth, upload, export)
   └── app/rag_bridge.py ──► rag.Engine.search() ──► SearchResult.to_api() (7 ключей)
```

- **Приоритет RAG, fallback на mock.** Если индекс недоступен (другая машина без
  5.8 ГБ файла) — прозрачный откат на демо-данные `app/query_engine.py`. Форма
  ответа идентична, фронтенд не меняется. Режим виден в `/api/health`
  (`"engine":"rag"|"mock"`) и в сайдбаре UI.
- **Тот же контракт.** У RAG и у mock один `SearchResult` из 7 ключей
  (`parsedQuery, answer, evidence, graph, gaps, contradictions, sources`).
- **Потокобезопасность.** Движок держит одно sqlite-соединение, привязанное к
  event-loop-потоку (инициализация в `startup`, эндпоинты `async` — как в
  `rag/api.py`).

> Индекс не входит в git (5.8 ГБ). Положите его в `rag/data/index.sqlite` или
> задайте путь через переменную окружения при необходимости; без него система
> автоматически работает в demo-режиме.

## Что реализовано

Полный evidence-pipeline (RAG: FTS5/BM25 + entity-expansion + RRF + числовые
фильтры; либо упрощённый NLP-fallback без внешних моделей):

```
запрос → parsed query (сущности + числовые условия) → retrieval/маршрутизация
→ фильтры → evidence table → граф знаний → противоречия → пробелы → confidence → SearchResult
```

### Три демо-сценария

| Сценарий | Запрос |
|---|---|
| Обессоливание воды | сульфаты/хлориды 200–300 мг/л, сухой остаток ≤1000 мг/дм³ |
| Циркуляция католита | оптимальная скорость потока при электроэкстракции никеля |
| Au/Ag/МПГ | распределение между штейном и шлаком за последние 5 лет |

Каждый сценарий возвращает claims с источниками, числовыми условиями, эффектами,
противоречиями и пробелами.

### Ключевые возможности движка

- **Извлечение числовых условий**: диапазоны (`200–300 мг/л`, `0,3–0,5 м/с`),
  ограничения (`≤1000 мг/дм³`, `< 5 °C`) с нормализацией и сохранением rawValue.
- **Извлечение сущностей** по доменному словарю RU/EN (материалы, процессы,
  технологии, свойства, оборудование) с синонимами.
- **География и временной диапазон** («мировая практика», «за последние 5 лет»).
- **Граф знаний**: `material → process → technology → condition → effect → source`.
- **Confidence + warnings**: система не скрывает неопределённость (противоречия,
  слабое покрытие, только зарубежные источники).
- **Экспорт** в Markdown / JSON.

## API endpoints

| Метод | Путь | Назначение |
|---|---|---|
| POST | `/api/query` | **Главный** — evidence-first `SearchResult` |
| GET | `/api/graph?topic=` | Граф знаний |
| GET | `/api/sources`, `/api/sources/{id}` | Источники |
| GET | `/api/contradictions` | Противоречия |
| GET | `/api/gaps` | Пробелы |
| GET | `/api/memory`, `/api/memory/{id}` | Evidence index (Research Memory) |
| GET | `/api/dashboard` | Метрики для дашборда (cards + indexStats) |
| GET | `/api/stats` | Статистика индекса RAG (chunk/relation/parameter counts) |
| POST | `/api/documents/upload` | Загрузка документа (mock pipeline) |
| GET | `/api/documents/{id}/status` | Статус обработки (шаги) |
| GET | `/api/documents/{id}/extraction` | Результат извлечения |
| POST | `/api/reports/export` | Экспорт отчёта (md/json) |
| POST | `/api/auth/login`, GET `/api/auth/me` | Демо-авторизация (роли) |

Контракт `SearchResult` соответствует разделу 8 Backend Developer Brief.

📘 **Полная спецификация API для фронтенд-разработчика:**
[`docs/API_APP.md`](docs/API_APP.md) — все эндпоинты с примерами ответов, контракт
`SearchResult`, CORS, режимы rag/mock и чек-лист интеграции.
Контракт `SearchResult` (движок RAG) — в [`rag/docs/API.md`](rag/docs/API.md).

## Структура

```
app/
  models.py        Pydantic-модели по контракту frontend
  data.py          Демо-корпус (mock fallback): источники, claims, memory
  query_engine.py  Fallback-движок: парсинг, извлечение условий, граф, синтез
  rag_bridge.py    Мост к RAG: Engine, маппинг фильтров, агрегаты, dashboard
  export.py        Генерация отчётов Markdown/JSON (из to_api-dict)
  main.py          FastAPI-приложение и все эндпоинты (RAG-aware + fallback)
rag/               GraphRAG-движок (retrieval/graph/analytics/answer) + индекс
static/
  index.html       Демо-UI (Dashboard, Search, Graph, Sources, Issues, Export)
run.py             Точка входа
```

## Проверка работоспособности

Быстрая ручная проверка (сервер должен быть запущен):

```bash
curl -X POST http://127.0.0.1:8000/api/query \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"скорость циркуляции католита при электроэкстракции никеля\"}"
```

> **Windows-заметка:** в Git Bash кириллица в `curl -d` искажается шеллом.
> Для запросов с русским текстом сохраняйте тело в UTF-8 файл и передавайте
> его через `--data-binary @file.json`. В консоли используйте
> `PYTHONIOENCODING=utf-8`, иначе вывод в cp1251 покажет «кракозябры»
> (сами данные при этом остаются в UTF-8).

Смоук-проверка движка без сервера:

```bash
.venv/Scripts/python.exe -c "from app.query_engine import run_query; r = run_query('обессоливание воды сульфаты 200-300 мг/л сухой остаток <=1000 мг/дм3'); print('evidence:', len(r.evidence), '| confidence:', r.answer.confidence)"
```
