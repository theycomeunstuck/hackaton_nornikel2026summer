"""FastAPI-приложение «Научный клубок» — evidence-first backend.

Запуск:
    uvicorn app.main:app --reload
    (или python -m app  /  python run.py)

Демо-UI:      http://127.0.0.1:8000/
Документация: http://127.0.0.1:8000/docs
"""
from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

from . import __version__, data, export
from .models import (
    Contradiction,
    DashboardStats,
    ExportReportRequest,
    ExportReportResponse,
    ExtractedConclusion,
    ExtractedParameter,
    ExtractedRelation,
    ExtractionEntities,
    ExtractionResultResponse,
    KnowledgeGap,
    KnowledgeGraph,
    LoginRequest,
    LoginResponse,
    MeResponse,
    ProcessingStatusResponse,
    ProcessingStep,
    QueryRequest,
    ResearchMemoryDetails,
    ResearchMemoryItem,
    SearchResult,
    Source,
    UploadResponse,
    UserPublic,
)
from .query_engine import build_graph, mock_search_api, route_scenario
from .rag_bridge import bridge

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(
    title="Научный клубок — Evidence Engine",
    description="Evidence-first платформа для научно-технических знаний "
    "горно-металлургической отрасли. No source — no factual claim.",
    version=__version__,
)

# CORS: открыт для любого origin (фронтенд на другом порту/домене).
# allow_credentials=False — обязательно при allow_origins=["*"], иначе браузер
# блокирует запросы. Авторизация идёт через Bearer-заголовок (не куки), поэтому
# режим credentials не нужен.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    """Инициализируем RAG-движок на event-loop-потоке (важно для sqlite)."""
    ok = bridge.init()
    mode = "RAG (реальный индекс)" if ok else f"MOCK (fallback: {bridge.init_error})"
    print(f"[Научный клубок] evidence engine: {mode}")


@app.on_event("shutdown")
def _shutdown() -> None:
    bridge.close()


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _json(payload) -> JSONResponse:
    """UTF-8 JSON без экранирования кириллицы."""
    return JSONResponse(content=payload, media_type="application/json; charset=utf-8")


def _dump(obj) -> dict:
    """Pydantic-модель -> dict в camelCase (by_alias)."""
    return obj.model_dump(by_alias=True)


# =============================================================================
# In-memory состояние
# =============================================================================

TOKENS: dict[str, UserPublic] = {}          # token -> user
UPLOADS: dict[str, dict] = {}                # documentId -> {meta, uploadedAtEpoch}
REPORTS: dict[str, dict] = {}               # reportId -> {content, media, filename, format}

DEMO_USER = UserPublic(
    id="user_001", name="Исследователь", role="researcher",
    organization="R&D центр",
)


# =============================================================================
# Auth
# =============================================================================


def get_current_user(authorization: Optional[str] = Header(None)) -> UserPublic:
    if not authorization or not authorization.lower().startswith("bearer "):
        # демо-режим: пускаем как исследователя, но эндпоинт /me это учитывает
        raise HTTPException(status_code=401, detail="Требуется авторизация")
    token = authorization.split(" ", 1)[1].strip()
    user = TOKENS.get(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Недействительный токен")
    return user


@app.post("/api/auth/login", response_model=LoginResponse, tags=["auth"])
def login(req: LoginRequest) -> LoginResponse:
    # Демо-авторизация: роль по префиксу email
    role = "researcher"
    for r in ("admin", "manager", "analyst", "researcher"):
        if req.email.lower().startswith(r):
            role = r
            break
    user = UserPublic(
        id=f"user_{uuid.uuid4().hex[:6]}",
        name=req.email.split("@")[0] or "Пользователь",
        role=role,  # type: ignore[arg-type]
        organization="R&D центр",
    )
    token = uuid.uuid4().hex
    TOKENS[token] = user
    return LoginResponse(accessToken=token, user=user)


@app.get("/api/auth/me", response_model=MeResponse, tags=["auth"])
def me(user: UserPublic = Depends(get_current_user)) -> MeResponse:
    return MeResponse(id=user.id, name=user.name,
                      email=f"{user.name}@example.org", role=user.role)


# =============================================================================
# Query — главный эндпоинт
# =============================================================================


@app.post("/api/query", tags=["query"])
async def query(req: QueryRequest):
    """Главный эндпоинт. Возвращает evidence-first SearchResult (7 ключей).

    Использует реальный RAG-движок (`rag`); при недоступности индекса —
    прозрачный fallback на демо-данные. Форма ответа идентична (`to_api`).
    """
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=422, detail="Пустой запрос")
    if bridge.available:
        try:
            return _json(bridge.search_api(req.query, top_k=15, filters=req.filters))
        except Exception as exc:  # надёжный fallback, если запрос сломал движок
            print(f"[query] RAG error, fallback to mock: {exc}")
    # mock в той же форме, что и RAG (единый контракт для фронтенда)
    return _json(mock_search_api(req.query, req.scenarioId, req.filters))


# =============================================================================
# Graph
# =============================================================================


@app.get("/api/graph", tags=["graph"])
async def graph(topic: Optional[str] = None):
    if bridge.available:
        try:
            return _json(bridge.graph_for(topic))
        except Exception as exc:
            print(f"[graph] RAG error, fallback to mock: {exc}")
    scenario = route_scenario((topic or "").lower(), None) if topic else "generic"
    if scenario == "generic":
        claims = data.ALL_CLAIMS
        contradictions = data.ALL_CONTRADICTIONS
        gaps = data.ALL_GAPS
    else:
        claims = data.claims_for(scenario)
        contradictions = data.contradictions_for(scenario)
        gaps = data.gaps_for(scenario)
    return _json(_dump(build_graph(claims, contradictions, gaps)))


# =============================================================================
# Sources
# =============================================================================


@app.get("/api/sources", tags=["sources"])
async def list_sources(
    geography: Optional[str] = None,
    type: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
):
    if bridge.available:
        try:
            srcs = bridge.aggregated_sources()
            if geography and geography != "all":
                geo = "domestic" if geography in ("domestic", "russia") else geography
                srcs = [s for s in srcs if (s.get("geography") or "") == geo]
            if type:
                srcs = [s for s in srcs if (s.get("sourceType") or "") == type]
            if year_from:
                srcs = [s for s in srcs if (s.get("year") or 0) >= year_from]
            if year_to:
                srcs = [s for s in srcs if (s.get("year") or 9999) <= year_to]
            return _json(srcs)
        except Exception as exc:
            print(f"[sources] RAG error, fallback to mock: {exc}")
    result = data.SOURCES
    if geography and geography != "all":
        geo = "russia" if geography in ("domestic", "russia") else geography
        result = [s for s in result if s.geography == geo]
    if type:
        result = [s for s in result if s.type == type]
    if year_from:
        result = [s for s in result if s.year and s.year >= year_from]
    if year_to:
        result = [s for s in result if s.year and s.year <= year_to]
    # заполняем relatedClaimIds
    for s in result:
        s.relatedClaimIds = [c.claimId for c in data.ALL_CLAIMS
                             if c.source.documentId == s.id]
    return result


@app.get("/api/sources/{source_id}", response_model=Source, tags=["sources"])
async def get_source(source_id: str) -> Source:
    # Реальная карточка источника из индекса/метаданных; mock — только fallback.
    if bridge.available:
        try:
            detail = bridge.source_detail(source_id)
            if detail is not None:
                return Source(**detail)
        except Exception as exc:
            print(f"[source] RAG error, fallback to mock: {exc}")
    src = data.SOURCES_BY_ID.get(source_id)
    if src is None:
        raise HTTPException(status_code=404, detail="Источник не найден")
    src.relatedClaimIds = [c.claimId for c in data.ALL_CLAIMS
                           if c.source.documentId == src.id]
    return src


# =============================================================================
# Contradictions & Gaps
# =============================================================================


@app.get("/api/contradictions", tags=["evidence"])
async def list_contradictions():
    if bridge.available:
        try:
            return _json(bridge.aggregated_contradictions())
        except Exception as exc:
            print(f"[contradictions] RAG error, fallback to mock: {exc}")
    return _json([_dump(c) for c in data.ALL_CONTRADICTIONS])


@app.get("/api/gaps", tags=["evidence"])
async def list_gaps():
    if bridge.available:
        try:
            return _json(bridge.aggregated_gaps())
        except Exception as exc:
            print(f"[gaps] RAG error, fallback to mock: {exc}")
    return _json([_dump(g) for g in data.ALL_GAPS])


# =============================================================================
# Research Memory (evidence index)
# =============================================================================


@app.get("/api/memory", response_model=list[ResearchMemoryItem], tags=["memory"])
def list_memory() -> list[ResearchMemoryItem]:
    return data.MEMORY_ITEMS


@app.get("/api/memory/{memory_id}", response_model=ResearchMemoryDetails, tags=["memory"])
def get_memory(memory_id: str) -> ResearchMemoryDetails:
    details = data.memory_details(memory_id)
    if details is None:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return details


# =============================================================================
# Dashboard
# =============================================================================


@app.get("/api/dashboard", tags=["dashboard"])
async def dashboard():
    if bridge.available:
        try:
            return _json(bridge.dashboard())
        except Exception as exc:
            print(f"[dashboard] RAG error, fallback to mock: {exc}")
    # mock-режим
    claims = data.ALL_CLAIMS
    full_graph = build_graph(claims, data.ALL_CONTRADICTIONS, data.ALL_GAPS)
    conf_rank = {"low": 1, "medium": 2, "high": 3}
    rank_label = {1: "low", 2: "medium", 3: "high"}
    avg = round(sum(conf_rank[c.confidence] for c in claims) / len(claims))
    cards = [
        {"label": "Документов", "value": len(data.DOCUMENTS) + len(UPLOADS)},
        {"label": "Claims", "value": len(claims)},
        {"label": "Источников", "value": len(data.SOURCES)},
        {"label": "Связей в графе", "value": len(full_graph.edges)},
        {"label": "Противоречий", "value": len(data.ALL_CONTRADICTIONS)},
        {"label": "Пробелов", "value": len(data.ALL_GAPS)},
        {"label": "Ср. достоверность", "value": rank_label.get(avg, "medium")},
    ]
    domains = {
        "hydrometallurgy": len(data.claims_for("catholyte")),
        "ecology": len(data.claims_for("desalination")),
        "pyrometallurgy": len(data.claims_for("metals")),
        "waste_processing": 0,
    }
    recent = sorted(claims, key=lambda c: c.year or 0, reverse=True)[:5]
    return _json({
        "mode": "mock",
        "cards": cards,
        "indexStats": None,
        "domainsCoverage": domains,
        "priorityGaps": [_dump(g) for g in data.ALL_GAPS if g.severity == "warning"],
        "recentClaims": [_dump(c) for c in recent],
    })


# =============================================================================
# Documents — ingestion (mock pipeline)
# =============================================================================

_PIPELINE_STEPS = [
    ("s1", "Файл загружен", "Документ принят и сохранён"),
    ("s2", "Текст извлечён", "Извлечение текста и разбиение на чанки"),
    ("s3", "Сущности найдены", "Материалы, процессы, параметры"),
    ("s4", "Связи построены", "Отношения между сущностями и claims"),
    ("s5", "Evidence index обновлён", "Claims и источники добавлены в индекс"),
]

_EXT_MAP = {"pdf": "pdf", "docx": "docx", "txt": "txt", "csv": "csv", "xlsx": "xlsx"}


@app.post("/api/documents/upload", response_model=UploadResponse, tags=["documents"])
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
) -> UploadResponse:
    ext = (file.filename or "file.txt").rsplit(".", 1)[-1].lower()
    file_type = _EXT_MAP.get(ext, "txt")
    doc_id = f"doc_up_{uuid.uuid4().hex[:8]}"
    content = await file.read()
    UPLOADS[doc_id] = {
        "documentId": doc_id,
        "title": title or (file.filename or doc_id),
        "fileName": file.filename or f"{doc_id}.{file_type}",
        "fileType": file_type,
        "uploadedAtEpoch": time.time(),
        "size": len(content),
    }
    return UploadResponse(
        documentId=doc_id,
        title=title or (file.filename or doc_id),
        fileName=file.filename or f"{doc_id}.{file_type}",
        fileType=file_type,  # type: ignore[arg-type]
        status="processing",
        uploadedAt=now_iso(),
    )


@app.get("/api/documents/{document_id}/status",
         response_model=ProcessingStatusResponse, tags=["documents"])
def document_status(document_id: str) -> ProcessingStatusResponse:
    meta = UPLOADS.get(document_id)
    if meta is None:
        # известный демо-документ считается обработанным
        if document_id in data.SOURCES_BY_ID:
            steps = [ProcessingStep(id=i, name=n, description=d, status="done")
                     for i, n, d in _PIPELINE_STEPS]
            return ProcessingStatusResponse(documentId=document_id,
                                            status="processed", steps=steps)
        raise HTTPException(status_code=404, detail="Документ не найден")

    # симуляция прогресса: ~1.2 сек на шаг
    elapsed = time.time() - meta["uploadedAtEpoch"]
    done_count = min(len(_PIPELINE_STEPS), int(elapsed // 1.2))
    steps: list[ProcessingStep] = []
    for idx, (sid, name, desc) in enumerate(_PIPELINE_STEPS):
        if idx < done_count:
            st = "done"
        elif idx == done_count:
            st = "running"
        else:
            st = "pending"
        steps.append(ProcessingStep(id=sid, name=name, description=desc, status=st))
    overall = "processed" if done_count >= len(_PIPELINE_STEPS) else "processing"
    return ProcessingStatusResponse(documentId=document_id, status=overall, steps=steps)


@app.get("/api/documents/{document_id}/extraction",
         response_model=ExtractionResultResponse, tags=["documents"])
async def document_extraction(document_id: str):
    # Реальная выжимка из индекса по конкретному document_id (сущности, числовые
    # параметры, связи, выводы). При недоступности индекса — демо-fallback ниже.
    if bridge.available:
        try:
            result = bridge.document_extraction(document_id)
            if result is None:
                raise HTTPException(status_code=404,
                                    detail="Документ не найден в индексе")
            return _json(result)
        except HTTPException:
            raise
        except Exception as exc:
            print(f"[extraction] RAG error, fallback to mock: {exc}")
    # Демо-fallback (образец по сценарию catholyte) — только без реального индекса
    scenario = "catholyte"
    claims = data.claims_for(scenario)
    materials, processes, equipment, properties = set(), set(), set(), set()
    parameters: list[ExtractedParameter] = []
    conclusions: list[ExtractedConclusion] = []
    relations: list[ExtractedRelation] = []
    for c in claims:
        materials.update(c.materials)
        if c.process:
            processes.add(c.process)
        equipment.update(c.equipment)
        for cond in c.conditions:
            properties.add(cond.name)
            parameters.append(ExtractedParameter(
                id=f"p_{uuid.uuid4().hex[:6]}", name=cond.name,
                value=cond.rawValue, unit=cond.unit,
                normalizedValue=cond.min if cond.min is not None else (
                    cond.value if isinstance(cond.value, (int, float)) else None),
                normalizedUnit=cond.unit, sourceText=cond.rawValue))
        conclusions.append(ExtractedConclusion(
            id=f"cc_{c.claimId}", claim=c.text, confidence=c.confidence,
            sourceIds=[c.source.documentId]))
        if c.technology:
            relations.append(ExtractedRelation(**{
                "id": f"r_{uuid.uuid4().hex[:6]}", "from": c.process or "процесс",
                "relation": "uses_technology", "to": c.technology,
                "confidence": c.confidence}))
    return ExtractionResultResponse(
        documentId=document_id,
        entities=ExtractionEntities(
            materials=sorted(materials), processes=sorted(processes),
            equipment=sorted(equipment), properties=sorted(properties),
            experts=["Сидоров К.В."]),
        parameters=parameters, conclusions=conclusions, relations=relations)


# =============================================================================
# Export
# =============================================================================


@app.post("/api/reports/export", response_model=ExportReportResponse, tags=["export"])
async def export_report(req: ExportReportRequest) -> ExportReportResponse:
    # Перезапускаем запрос, чтобы получить актуальный SearchResult (to_api dict).
    # queryId здесь несёт текст запроса (персистентности запросов нет); при его
    # отсутствии используем title.
    query_text = req.queryId or req.title
    if bridge.available:
        try:
            result = bridge.search_api(query_text, top_k=15)
        except Exception:
            result = mock_search_api(query_text)
    else:
        result = mock_search_api(query_text)

    created = now_iso()
    report_id = f"rep_{uuid.uuid4().hex[:10]}"

    if req.format == "markdown":
        content = export.to_markdown(
            result, req.title, query_text, created,
            include_graph=req.includeGraph, include_sources=req.includeSources,
            include_contradictions=req.includeContradictions,
            include_gaps=req.includeGaps)
        media, filename = "text/markdown", f"{report_id}.md"
    else:  # json (и pdf-заглушка отдаётся как json)
        content = export.to_json(result, req.title, query_text, created)
        media, filename = "application/json", f"{report_id}.json"

    REPORTS[report_id] = {"content": content, "media": media,
                          "filename": filename, "format": req.format}
    return ExportReportResponse(
        reportId=report_id,
        downloadUrl=f"/api/reports/{report_id}/download",
        format=req.format,
        createdAt=created,
    )


@app.get("/api/reports/{report_id}/download", tags=["export"])
def download_report(report_id: str):
    rep = REPORTS.get(report_id)
    if rep is None:
        raise HTTPException(status_code=404, detail="Отчёт не найден")
    return PlainTextResponse(
        content=rep["content"], media_type=rep["media"],
        headers={"Content-Disposition": f'attachment; filename="{rep["filename"]}"'})


# =============================================================================
# Health & демо-сценарии
# =============================================================================


@app.get("/api/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok", "service": "Научный клубок", "version": __version__,
            "engine": "rag" if bridge.available else "mock"}


@app.get("/api/stats", tags=["meta"])
async def stats():
    """Статистика индекса RAG (chunk/relation/parameter counts)."""
    if bridge.available:
        return _json({"mode": "rag", **bridge.stats()})
    return _json({"mode": "mock", "documents": len(data.DOCUMENTS),
                  "claims": len(data.ALL_CLAIMS), "sources": len(data.SOURCES)})


@app.get("/api/scenarios", tags=["meta"])
def scenarios() -> list[dict]:
    return [
        {"id": "desalination",
         "title": "Обессоливание воды",
         "query": "Какие методы обессоливания воды подходят для обогатительной "
                  "фабрики, если исходная вода содержит сульфаты, хлориды, Ca, Mg, "
                  "Na по 200–300 мг/л, а требуемый сухой остаток — ≤1000 мг/дм³?"},
        {"id": "catholyte",
         "title": "Циркуляция католита",
         "query": "Какие технические решения организации циркуляции католита при "
                  "электроэкстракции никеля описаны в мировой практике, и какая "
                  "скорость потока считается оптимальной?"},
        {"id": "metals",
         "title": "Распределение Au/Ag/МПГ",
         "query": "Покажите все эксперименты и публикации по распределению Au, Ag и "
                  "МПГ между медным/никелевым штейном и шлаком за последние 5 лет."},
    ]


# =============================================================================
# Статика / демо-UI
# =============================================================================

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# React-фронтенд (frontend/dist, сборка: cd frontend && VITE_API_BASE_URL=/ npm run build).
# Если сборка есть — она раздаётся с корня (single-origin: UI + API на одном порту),
# а старый demo-UI остаётся на /demo. Если сборки нет — на корне старый demo-UI.
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")),
              name="frontend-assets")


def _demo_html() -> HTMLResponse:
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return HTMLResponse(index_file.read_text(encoding="utf-8"))
    return HTMLResponse("<h1>Научный клубок</h1><p>UI не найден. См. /docs</p>")


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def index() -> HTMLResponse:
    spa = FRONTEND_DIST / "index.html"
    if spa.exists():
        return HTMLResponse(spa.read_text(encoding="utf-8"))
    return _demo_html()


@app.get("/demo", response_class=HTMLResponse, include_in_schema=False)
def demo_ui() -> HTMLResponse:
    return _demo_html()


@app.get("/{full_path:path}", response_class=HTMLResponse, include_in_schema=False)
def spa_fallback(full_path: str) -> HTMLResponse:
    """SPA-fallback: клиентские роуты React Router отдают index.html.
    /api-пути сюда не попадают (совпадают с реальными роутами выше) — но на
    всякий случай неизвестный /api/* честно возвращает 404, а не HTML."""
    if full_path.startswith(("api/", "api")) and full_path.split("/")[0] == "api":
        raise HTTPException(status_code=404, detail="Не найдено")
    spa = FRONTEND_DIST / "index.html"
    if spa.exists():
        return HTMLResponse(spa.read_text(encoding="utf-8"))
    return _demo_html()
