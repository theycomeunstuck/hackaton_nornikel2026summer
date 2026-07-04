# Teammate onboarding — Role 4 (Retrieval / Graph / Analytics / RAG)

Read this, then `CLAUDE.md` (the full standing brief). This file gets you running
in ~5 minutes and tells you where to touch things without breaking the contract.

## What this module does
Question ➜ **one `SearchResult`** where every statement traces to
`chunkId + page + documentId + sourceName`. Answers come **only** from retrieved,
sourced evidence — never model memory.

```
query ─▶ parse ─▶ FTS/BM25 ⊕ entity-expansion ─▶ RRF ─▶ metadata + numeric filters
      ─▶ evidence ─▶ graph ─▶ contradictions ─▶ gaps ─▶ answer ─▶ SearchResult
```

## 0. Prereqs
- Python 3.10+ (stdlib `sqlite3` must have FTS5 — it does on default builds).
- The prebuilt index at `backend/data/index.sqlite` (≈6 GB). If you don't have it,
  ask for the file or build one (see below). **Do not rebuild if you have it.**

## 1. Run everything (from repo root, the parent of `backend/`)
```bash
# fixtures demo — zero setup, no index needed
python -m backend.demo --scenario catholyte

# tests (must stay green)
python -m backend.tests_run                 # 13 passed, 0 failed

# real index demo
python -m backend.demo --db backend/data/index.sqlite --scenario desalination
python -m backend.index stats --db backend/data/index.sqlite

# HTTP API for the frontend
pip install -r backend/requirements.txt
uvicorn backend.api:app --host 0.0.0.0 --port 8000
python -m backend.api_smoke                 # 7 passed, 0 failed (needs the index)
```

> **cwd matters.** Everything is a `backend.*` module, so run from the *parent* of
> `backend/` (paths like `backend/data/index.sqlite` are relative to that).

## 2. Project layout (who does what)
| Area | Files | You edit when… |
|------|-------|----------------|
| Contract | `contracts.py` | Never rename a `# CONTRACT` field. API mapping lives in `to_api()` only. |
| Load/index | `loader.py`, `index.py` | Changing how the archive is read/indexed. Streaming only for the giants. |
| Retrieval | `retrieval/{query_parser,lexical,fusion,filters,evidence,vector,pipeline}.py` | Ranking/parsing/filtering logic. `pipeline.Engine` is the entry point. |
| Graph | `graph/graph_build.py` | The sourced neighbourhood graph. |
| Analytics | `analytics/{gaps,contradictions}.py` | Gap/contradiction heuristics. |
| Answer | `answer/synthesize.py` | The deterministic cited answer (no LLM). |
| HTTP | `api.py`, `api_smoke.py` | The frontend-facing wrapper (thin — no logic). |
| Docs | `docs/*.md`, `README.md`, `CLAUDE.md` | Keep these current. |

## 3. Golden rules (break these and the demo breaks)
1. **Never load a multi-GB JSONL into RAM.** `chunks/mentions/relations` are
   streamed (build) or queried via SQLite (serve). No `.readlines()` on them.
2. **Index once, query many.** Retrieval reads `index.sqlite`, not raw JSONL.
3. **Source is sacred.** Every evidence item / edge / contradiction keeps
   `documentId + chunkId + page + sourceName`. A test fails if any is dropped.
4. **`SearchResult` shape is frozen.** Internal = snake_case, API = camelCase,
   mapping in `to_api()` only. The frontend never sees the mode.
5. **Numeric filtering never silently drops** a candidate whose numbers it can't
   parse — degrade to a soft signal + a gap.
6. **MVP path is stdlib-only.** SQLite/FTS5. Qdrant/Neo4j/networkx are day-2/optional.
7. **Deterministic numeric parsing**, never LLM. Reuse the extractor's regex.
8. **Repair mojibake** before indexing/display.

## 4. Verify after EVERY change
```bash
python -m backend.demo            # sanity on fixtures
python -m backend.tests_run       # keep green — never edit a test to hide a regression
```
Before saying "done", run the three demo scenarios (desalination / catholyte / pgm)
— judges score exactly those.

## 5. Building an index (only if you must)
```bash
# ARCHIVE = a dir containing data/processed + data/extracted[_with_params]
python -m backend.index build --data-root $ARCHIVE --db backend/data/index.sqlite --limit 20000   # dev
python -m backend.index build --data-root $ARCHIVE --db backend/data/index.sqlite                  # full (slow)
```
If the archive has `data/extracted_with_params/parameters.jsonl`, it is
auto-discovered and numeric filtering becomes **structured** automatically — no
code change.

## 6. Who owns what across the team
- **Extraction teammate** owns the archive (`nornikel.7z`) and the JSONL contracts.
  Open asks are in `CLAUDE.md` → "What to ask the extraction teammate" (top item:
  persist `parameters.jsonl` — already done in this index; next: `claims.jsonl`).
- **Frontend** consumes the API in `docs/API.md`. The `SearchResult` shape is the
  interface — coordinate any change through `to_api()` only.
- **Role 4 (us)** owns everything under `backend/`.

See `docs/ROADMAP.md` for what's left.
