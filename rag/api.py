"""Minimal HTTP wrapper around the Mode-B retrieval pipeline (Role 4).

Thin adapter only: it does NOT touch retrieval / index / search logic and does
NOT change the ``SearchResult`` JSON shape. It just constructs one long-lived
:class:`~backend.retrieval.pipeline.Engine` over the prebuilt SQLite index and
exposes ``Engine.search`` / the demo scenarios over HTTP for the frontend.

Run:
    uvicorn backend.api:app --host 0.0.0.0 --port 8000

Config (env):
    RAG_DB_PATH   path to the prebuilt index (default: backend/data/index.sqlite)

Endpoints:
    GET  /api/health            -> {"status": "ok"}
    GET  /api/stats             -> index stats (same as `python -m backend.index stats`)
    GET  /api/demo/{scenario}   -> SearchResult JSON (scenario in desalination|catholyte|pgm)
    POST /api/search  {query, topK}  -> SearchResult JSON
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .demo import FIXTURES, SCENARIOS
from .retrieval.pipeline import Engine

# --- config ----------------------------------------------------------------
_DEFAULT_DB = Path(__file__).resolve().parent / "data" / "index.sqlite"
RAG_DB_PATH = os.environ.get("RAG_DB_PATH") or str(_DEFAULT_DB)
# entities/synonyms come from the small fixtures dir (same as `demo`); the API
# must not require the original multi-GB nornikel data root.
RAG_DATA_ROOT = os.environ.get("RAG_DATA_ROOT") or FIXTURES
NOW_YEAR = int(os.environ.get("RAG_NOW_YEAR", "2026"))
DEMO_TOP_K = 12   # matches `python -m backend.demo` default -> reproduces samples


# --- lifespan: build the Engine once, reuse across requests -----------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    if not Path(RAG_DB_PATH).exists():
        raise RuntimeError(
            f"Index not found at {RAG_DB_PATH}. Set RAG_DB_PATH or build it first "
            f"(python -m backend.index build ...)."
        )
    app.state.engine = Engine(RAG_DB_PATH, RAG_DATA_ROOT, now_year=NOW_YEAR)
    try:
        yield
    finally:
        app.state.engine.close()


app = FastAPI(title="Научный клубок — RAG API (Role 4)", version="1.0", lifespan=lifespan)

# CORS: wide-open for hackathon frontend dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _json(payload) -> JSONResponse:
    """UTF-8, non-ASCII-escaped JSON (Cyrillic stays readable)."""
    return JSONResponse(content=payload, media_type="application/json; charset=utf-8")


# --- request models ---------------------------------------------------------
class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    topK: int = Field(15, ge=1, le=50)


# --- endpoints --------------------------------------------------------------
# NOTE: endpoints are ``async def`` on purpose. The Engine holds ONE SQLite
# connection created on the event-loop thread at startup; sync endpoints would
# run in a threadpool and trip SQLite's same-thread guard. Running inline on the
# event loop keeps every query on that thread and serializes access — fine for a
# single-connection hackathon demo.
@app.get("/api/health")
async def health():
    return _json({"status": "ok"})


@app.get("/api/stats")
async def stats():
    return _json(app.state.engine.index.stats())


@app.get("/api/demo/{scenario}")
async def demo(scenario: str):
    if scenario not in SCENARIOS:
        raise HTTPException(
            status_code=404,
            detail=f"unknown scenario '{scenario}'; expected one of {list(SCENARIOS)}",
        )
    result = app.state.engine.search(SCENARIOS[scenario], top_k=DEMO_TOP_K)
    return _json(result.to_api())


@app.post("/api/search")
async def search(req: SearchRequest):
    result = app.state.engine.search(req.query, top_k=req.topK)
    return _json(result.to_api())
