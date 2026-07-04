# Научный клубок — Evidence Engine

Evidence-first backend + демо-UI для работы с научно-техническими знаниями
горно-металлургической отрасли (хакатон «Научный клубок», задача 2).

> **No source — no factual claim.** Каждый вывод привязан к источнику, условию
> и уровню достоверности. Платформа возвращает не текстовый ответ чат-бота, а
> проверяемую доказательную структуру: parsed query → claims → evidence table →
> источники → confidence → граф → противоречия → пробелы → отчёт.

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

## Что реализовано

Полный evidence-pipeline на упрощённом NLP (без внешних моделей):

```
запрос → parsed query (сущности + числовые условия) → маршрутизация к сценарию
→ фильтрация claims → граф знаний → противоречия → пробелы → confidence → SearchResult
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
| GET | `/api/dashboard` | Метрики для дашборда |
| POST | `/api/documents/upload` | Загрузка документа (mock pipeline) |
| GET | `/api/documents/{id}/status` | Статус обработки (шаги) |
| GET | `/api/documents/{id}/extraction` | Результат извлечения |
| POST | `/api/reports/export` | Экспорт отчёта (md/json) |
| POST | `/api/auth/login`, GET `/api/auth/me` | Демо-авторизация (роли) |

Контракт `SearchResult` соответствует разделу 8 Backend Developer Brief.

## Структура

```
app/
  models.py        Pydantic-модели по контракту frontend
  data.py          Демо-корпус: источники, claims, противоречия, пробелы, memory
  query_engine.py  Парсинг запроса, извлечение условий, граф, синтез ответа
  export.py        Генерация отчётов Markdown/JSON
  main.py          FastAPI-приложение и все эндпоинты
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
