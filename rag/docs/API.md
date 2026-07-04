# HTTP API reference — «Научный клубок» RAG (Role 4)

Thin HTTP layer over the Mode-B retrieval pipeline. It **reuses** the prebuilt
SQLite index and returns the **frozen `SearchResult` shape** — the same JSON the
demo prints. This doc is for the **frontend** teammate.

Source: `backend/api.py`. Smoke check: `backend/api_smoke.py`.

---

## Run the server

```bash
# from repo root (the parent of backend/)
pip install -r backend/requirements.txt          # fastapi + uvicorn only
uvicorn backend.api:app --host 0.0.0.0 --port 8000
```

Config via env vars:

| Var | Default | Meaning |
|-----|---------|---------|
| `RAG_DB_PATH` | `backend/data/index.sqlite` | Prebuilt index to serve. |
| `RAG_DATA_ROOT` | `backend/data/fixtures` | Small entities/synonyms dir (no multi-GB archive needed). |
| `RAG_NOW_YEAR` | `2026` | Reference year for "за последние N лет". |

CORS is wide-open (`*`) for dev. Responses are `application/json; charset=utf-8`
with Cyrillic **not** escaped.

---

## Endpoints

### `GET /api/health`
Liveness probe.
```json
{ "status": "ok" }
```

### `GET /api/stats`
Index statistics (same as `python -m backend.index stats`). Values are strings.
```json
{
  "chunk_count": "441714",
  "relation_count": "2675584",
  "mention_count": "0",
  "parameter_count": "696234",
  "has_parameters": "1",
  "limited": "0",
  "data_root": "…"
}
```
`has_parameters: "1"` ⇒ numeric filtering is **structured** (claim-grade), not
approximate. Use this to decide whether to show a "numeric match: exact" badge.

### `GET /api/demo/{scenario}`
`scenario` ∈ `desalination` | `catholyte` | `pgm`. Runs the canonical judged query
with `topK=12` and returns a `SearchResult`. **Reproduces
`backend/data/sample_<scenario>_server.json` byte-for-byte** — safe to build the UI
against those sample files offline.

Unknown scenario ⇒ `404` with `{"detail": "..."}`.

| scenario | numericMode | note |
|----------|-------------|------|
| `desalination` | `structured` | numeric conditions shown on evidence |
| `catholyte` | `none` | graph + contradictions are the story |
| `pgm` | `none` | temporal (`timeRange`) + multi-entity |

### `POST /api/search`
```jsonc
// request
{ "query": "Какая скорость потока католита оптимальна…?", "topK": 15 }
```
`topK` optional (default 15, clamped 1–50). Returns a `SearchResult`.

Validation errors (empty query, topK out of range) ⇒ `422` (FastAPI standard).

---

## The `SearchResult` shape (frozen — 7 top-level keys)

```jsonc
{
  "parsedQuery":   { "intent", "materials", "processes", "technologies",
                     "properties", "conditions", "geography", "timeRange" },
  "answer":        { "shortConclusion", "confidence", "confidenceReason",
                     "warnings", "numericMode" },   // numericMode: none|approximate|structured
  "evidence":      [ { "id", "text", "score", "confidence", "conditions",
                       "matchedTerms", "numericStatus",
                       "source": { "documentId", "sourceName", "chunkId", "page",
                                   "sectionTitle", "sourceType", "year", "geography" } } ],
  "graph":         { "nodes": [ { "id", "label", "type" } ],
                     "edges": [ { "id", "source", "target", "relation",
                                  "sourceRef", "evidenceText" } ] },
  "gaps":          [ { "id", "type", "title", "description", "severity" } ],
  "contradictions":[ { "id", "title", "description", "sourceA", "sourceB", "status" } ],
  "sources":       [ { "documentId", "sourceName", "chunkId", "page", … } ]
}
```

**Rendering contract (do not drop):** every `evidence[].source`, every graph edge's
`sourceRef`, and every contradiction's `sourceA`/`sourceB` carries
`documentId + chunkId + page + sourceName`. Always show them — this is an
evidence-first system; unsourced text must never appear.

`numericMode`:
- `none` — query had no numeric constraint.
- `approximate` — numbers re-parsed from chunk text (index built without parameters).
- `structured` — numbers from `parameters.jsonl` (claim-grade). Current full index.

`contradictions[].status`: `possible` | `needs_review` — **heuristic**, label them
as such in the UI (e.g. "возможное противоречие"), never as confirmed.

---

## Examples

curl:
```bash
curl -s http://localhost:8000/api/health
curl -s http://localhost:8000/api/stats
curl -s http://localhost:8000/api/demo/desalination | python -m json.tool | head
curl -s -X POST http://localhost:8000/api/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"Какая скорость потока католита оптимальна при электроэкстракции никеля?","topK":15}'
```

frontend `fetch`:
```js
const BASE = import.meta.env.VITE_RAG_BASE ?? "http://localhost:8000";

export const getDemo   = (s)        => fetch(`${BASE}/api/demo/${s}`).then(r => r.json());
export const getStats  = ()         => fetch(`${BASE}/api/stats`).then(r => r.json());
export const search     = (query, topK = 15) =>
  fetch(`${BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, topK }),
  }).then(r => r.json());   // -> SearchResult
```

---

## Notes / gotchas
- Endpoints are `async def` on purpose: the Engine holds **one** SQLite connection
  bound to the event-loop thread, so requests **serialize**. Fine for the demo; for
  real concurrency we'd need a connection pool (see ROADMAP).
- First request after boot is warm already — the index opens read-only at startup.
- No auth, no rate limit — dev only. Do not expose publicly as-is.
