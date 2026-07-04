# Retrieval / Graph / Analytics / RAG — Mode B (Role 4)

Evidence-first GraphRAG backend for «Научный клубок». Turns a question + the
extraction archive (chunks/entities/mentions/relations, **no claims.jsonl**,
**parameters.jsonl optional**) into one stable **`SearchResult`**.

```
query ─▶ parse ─▶ FTS/BM25 ⊕ entity-expansion ─▶ RRF ─▶ metadata + numeric filters
      ─▶ evidence table ─▶ graph ─▶ contradictions ─▶ gaps ─▶ answer ─▶ SearchResult
```

The giant files (chunks 2.3 GB, mentions 3.1 GB, relations 2.1 GB) are **streamed
into a SQLite/FTS5 index** — never loaded into RAM. Only documents/entities/
synonyms (small) live in memory. Stdlib only; no Neo4j/Qdrant/pytest required.

**Docs for teammates:** [`docs/ONBOARDING.md`](docs/ONBOARDING.md) (setup + rules) ·
[`docs/API.md`](docs/API.md) (HTTP API for frontend) ·
[`docs/ROADMAP.md`](docs/ROADMAP.md) (remaining goals) · `CLAUDE.md` (full brief).

## Run it now (zero setup, fixtures)
```bash
# from repo root (parent of backend/)
python -m backend.demo                       # catholyte scenario -> SearchResult JSON
python -m backend.demo --scenario desalination
python -m backend.demo --scenario pgm
python -m backend.tests_run                  # 13 passed, 0 failed   (or: pytest backend/tests -q)
```

## HTTP API for the frontend (`backend/api.py`)
Thin FastAPI wrapper over `Engine.search()`. It **reuses** the prebuilt index and
the frozen `SearchResult` shape — no retrieval/index logic is changed, and the
index is never rebuilt.

```bash
# install (adds only fastapi + uvicorn)
pip install -r backend/requirements.txt      # or: pip install fastapi uvicorn

# run (from repo root, parent of backend/)
uvicorn backend.api:app --host 0.0.0.0 --port 8000
# uses backend/data/index.sqlite by default; override with:
RAG_DB_PATH=/path/to/index.sqlite uvicorn backend.api:app --host 0.0.0.0 --port 8000

# dependency-free smoke check (boots the app in-process, hits every endpoint):
python -m backend.api_smoke
```

**Endpoints**

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET  | `/api/health` | — | `{"status":"ok"}` |
| GET  | `/api/stats` | — | index stats (same as `python -m backend.index stats`) |
| GET  | `/api/demo/{scenario}` | `scenario` ∈ `desalination`\|`catholyte`\|`pgm` | `SearchResult` JSON |
| POST | `/api/search` | `{"query": "...", "topK": 15}` | `SearchResult` JSON |

The `/api/demo/*` endpoints reproduce `backend/data/sample_*_server.json` exactly
(same queries, `topK=12`). CORS is wide-open for dev; JSON is UTF-8 (Cyrillic is
not escaped).

**curl**
```bash
curl -s http://localhost:8000/api/health
curl -s http://localhost:8000/api/stats
curl -s http://localhost:8000/api/demo/catholyte | python -m json.tool | head
curl -s -X POST http://localhost:8000/api/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"Какая скорость потока католита оптимальна при электроэкстракции никеля?","topK":15}'
```

**Frontend (fetch)**
```js
const BASE = "http://localhost:8000";
await fetch(`${BASE}/api/demo/desalination`).then(r => r.json());
await fetch(`${BASE}/api/search`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "…", topK: 15 }),
}).then(r => r.json());   // -> { parsedQuery, answer, evidence, graph, gaps, contradictions, sources }
```

## Build an index from the real archive
```bash
# extract the archive somewhere (ARCHIVE = dir containing data/processed + data/extracted)
# dev index (fast, first 20k chunks):
python -m backend.index build --data-root $ARCHIVE --db backend/data/index.sqlite --limit 20000
# full index (slow, all chunks; add --with-mentions to enable the entity channel fully):
python -m backend.index build --data-root $ARCHIVE --db backend/data/index.sqlite
# query it:
python -m backend.demo --db backend/data/index.sqlite --data-root $ARCHIVE \
    --query "Какая скорость потока католита оптимальна при электроэкстракции никеля?"
python -m backend.index stats --db backend/data/index.sqlite
```

## When `parameters.jsonl` appears (auto-strengthening)
Point `--data-root` at the run that contains
`data/extracted_with_params/parameters.jsonl` (auto-discovered) and **rebuild the
index**. Numeric filtering upgrades from `numericMode:"approximate"` (re-parsed
from chunk text) to `"structured"` (claim-grade) automatically. **No API change.**

## The one contract: `SearchResult.to_api()`
Exactly these 7 keys, stable across Mode B / Mode A and with/without parameters:
```jsonc
{
  "parsedQuery":   { intent, materials, processes, technologies, properties, conditions, geography, timeRange },
  "answer":        { shortConclusion, confidence, confidenceReason, warnings, numericMode },
  "evidence":      [ { id, text, score, confidence, conditions, matchedTerms, numericStatus,
                       source:{documentId, sourceName, chunkId, page, sectionTitle, sourceType, year, geography} } ],
  "graph":         { nodes:[{id,label,type}], edges:[{id,source,target,relation,sourceRef,evidenceText}] },
  "gaps":          [ { id, type, title, description, severity } ],
  "contradictions":[ { id, title, description, sourceA, sourceB, status } ],
  "sources":       [ { documentId, sourceName, chunkId, page, ... } ]
}
```
Frontend mock: `python -m backend.demo > sample.json` and build against it.

## Module map
| File | Role | Status |
|------|------|--------|
| `contracts.py` | all contracts + `to_api()` (snake_case internal / camelCase API) | ✅ |
| `numeric.py` | shared deterministic numeric parser (query + chunk + parameters.jsonl) | ✅ pure |
| `normalize.py` | term normalize + conservative mojibake repair | ✅ pure |
| `loader.py` | RAM-load docs/entities/synonyms; **stream** the giants; path resolver | ✅ |
| `index.py` | **SQLite FTS5** build + query API + CLI (`build`/`stats`) | ✅ |
| `retrieval/query_parser.py` | entities/numeric/time/geography + synonyms (3 scenarios) | ✅ pure |
| `retrieval/lexical.py` | FTS/BM25 channel | ✅ |
| `retrieval/fusion.py` | RRF (works with 1 active channel) | ✅ pure |
| `retrieval/vector.py` | optional vector interface + `NullVectorSearcher` (day-2 Qdrant) | 🟡 stub |
| `retrieval/filters.py` | metadata + numeric (structured-or-reparse, never silent-drop) | ✅ pure |
| `retrieval/evidence.py` | curate 8–15, diversify by doc, preserve source | ✅ pure |
| `retrieval/pipeline.py` | `Engine` + `search()` orchestration | ✅ |
| `graph/graph_build.py` | small sourced graph from retrieved chunks (≤30 nodes/50 edges) | ✅ pure |
| `analytics/gaps.py` | knowledge/weak/geographic/evidence/numeric/combination gaps | ✅ pure |
| `analytics/contradictions.py` | degraded Mode B (effect-relation + numeric non-overlap) | ✅ pure |
| `answer/synthesize.py` | deterministic cited answer (no LLM) | ✅ |

## Known limitations (honest)
- **Numeric filtering is best-effort without `parameters.jsonl`**: it re-parses
  numbers from the retrieved chunk text. It only drops a chunk on a *comparable*
  conflicting number; unparseable numbers are kept and flagged
  (`numericStatus:"unmatched"`, a `missing_numeric_data` gap, a warning). Not
  claim-grade until parameters are indexed.
- **Contradictions are degraded** in Mode B (effect-relation opposition + numeric
  non-overlap across documents), `status:"possible"|"needs_review"`. Real
  claim-effect contradictions need `claims.jsonl` (Mode A hook is stubbed).
- **Vector search is off** — retrieval is lexical (FTS/BM25) only; RRF is wired
  and will fuse the vector channel the moment `QdrantVectorSearcher` lands.
- Entity-expansion channel needs `relations` (always indexed); the mentions
  index is optional (`--with-mentions`).
