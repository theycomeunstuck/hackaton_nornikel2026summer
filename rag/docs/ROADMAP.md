# Remaining goals / roadmap — Role 4

Status legend: ✅ done · 🟡 partial/stub · ⬜ not started.
Priority: **P0** = needed for the judged demo · **P1** = quality/robustness ·
**P2** = nice-to-have / post-hackathon.

## Where we are
- ✅ Mode-B pipeline end-to-end (parse → FTS/BM25 ⊕ entity-expansion → RRF →
  metadata + numeric filters → evidence → graph → contradictions → gaps → answer).
- ✅ Full SQLite index built: 441 714 chunks, 2 675 584 relations, **696 234
  parameters** ⇒ numeric filtering is **structured**, not approximate.
- ✅ Three judged scenarios pass; outputs frozen in `data/sample_*_server.json`.
- ✅ HTTP API (`api.py`) + smoke check (`api_smoke.py`), 13 + 7 tests green.

## P0 — demo-critical (do these first)
- [x] **Tune contradiction noise.** ✅ Done. `analytics/contradictions.py`
  rewritten. Numeric signal now (a) ignores unnamed `numeric_value` blobs and
  (b) ignores subject-dependent generics (`содержание`/`концентрация`/
  `извлечение` — "content OF what?"); relation-effect signal now requires
  opposite typed relations on the **same axis** (`INCREASES`↔`REDUCES`,
  `IMPROVES`↔`WORSENS`; no bogus cross-axis pairs), conf ≥ 0.7, one item per
  entity-pair/param bucket, ranked + capped (≤3 each, ≤6 total). Result on the
  full index: **7/10/8 → 0/0/0** — the old ones were all false positives (e.g.
  "выход по току 95–98 %" vs "выход из строя 40 % мощности"). The fixture demo
  still shows the real `скорость потока` 0,8–1,2 vs 0,3–0,5 м/с conflict.
  Follow-up (see P1 "subject-linked numerics") would recover *real* same-subject
  content contradictions the conservative gate currently drops.
- [ ] **Label heuristics honestly in the UI + answer.** `status` is
  `possible|needs_review`; the answer `warnings` must say numeric/contradiction
  findings are best-effort. Coordinate copy with frontend (`docs/API.md`).
- [ ] **Regenerate frontend samples** whenever the pipeline changes:
  `python -m backend.demo --db backend/data/index.sqlite --scenario <s>` →
  `data/sample_<s>_server.json`. The API reproduces these byte-for-byte, so they're
  the frontend's offline fixture. Keep them in sync.

## P1 — quality & robustness
- [~] **Subject-linked numerics (recover real content contradictions).**
  *Detector side done; blocked on upstream data.* `analytics/contradictions.py`
  now buckets numeric conflicts by `(param_head, SUBJECT, unit)` and compares a
  generic head (`содержание`/…) only when the name carries a subject
  ("содержание железа"), against the same subject — recovering
  "содержание железа 50 %" vs "10–15 %" while never comparing Fe to Si or a bare
  "содержание". Proven by `tests/…::test_subject_qualified_numeric_contradiction`
  + the `data/fixtures/subject/` fixture.
  **Still 0 on the full index**, because the subject can only come from the
  parameter NAME and the extractor currently emits BARE names. A separate
  subject-entity link via `HAS_PARAMETER` was evaluated and **rejected**:
  number-matching yields many candidate subjects per value, and the linked entity
  is the *owner material* (концентрат), not the measured substance — it neither
  separates SiO2/Bi2O3 nor unifies Fe-vs-Fe. **Upstream fix (extraction team):**
  emit subject-qualified parameter names (`"содержание железа"`) or a `subject`
  field on each `ParameterValue`; the detector then recovers real contradictions
  corpus-wide with no code change.
- [ ] **Index mentions.** `mention_count = 0` in the current index (built without
  `--with-mentions`). The entity-expansion channel currently rides on `relations`
  only; adding mentions sharpens evidence to the mention **sentence** and improves
  recall. Cost: +3.1 GB index / longer build. → rebuild with `--with-mentions`.
- [ ] **Entity vocabulary from the real archive.** The API loads entities/synonyms
  from `data/fixtures` (tiny) so it needs no multi-GB root. For best entity
  detection, extract the real `entities.jsonl` (6.9 MB) + `synonyms.json` (2.5 MB)
  to a small dir and point `RAG_DATA_ROOT` at it. No code change. → `loader.py`,
  `retrieval/query_parser.py`.
- [ ] **API concurrency.** One SQLite connection, requests serialize (endpoints are
  `async def` by design). Fine for a single-user demo; for load, move to a
  per-request read-only connection or a small pool. → `api.py` / `index.py`.
- [ ] **Graph legibility.** Cap and rank edges so the demo graph reads cleanly
  (drop `MENTIONED_WITH` when a better-typed edge exists; the code already prefers
  typed edges — verify the cap on real data). → `graph/graph_build.py`.
- [ ] **Stale `data_root` in index meta** points at a Windows path from the build
  machine. Harmless (unused at serve time) but confusing in `/api/stats`; blank it
  or omit from the API response. → `index.py` (`stats()`), or filter in `api.py`.

## P2 — bigger swings
- [ ] **Vector channel (`VectorSearcher`).** RRF already fuses it; today it's a
  `NullVectorSearcher`. Add a local embedding + Qdrant (or a stdlib cosine over a
  cached matrix) implementation to lift recall on paraphrased queries.
  → `retrieval/vector.py` (day-2 recipe noted in CLAUDE.md).
- [ ] **Mode A (claims).** If the extraction team ships `claims.jsonl`, `loader`
  auto-detects Mode A. Wire the claim-aware evidence unit + real claim-vs-claim
  numeric contradictions. `SearchResult` shape is unchanged — only internal
  producers + `to_api()`-fed data change. → `loader.py`, `retrieval/pipeline.py`,
  `analytics/contradictions.py`.
- [ ] **LLM answer synthesis (optional).** Current `answer/synthesize.py` is
  deterministic (no LLM) and cites `[N]`. An evidence-first LLM pass could smooth
  prose *without* introducing unsourced claims — every sentence must still cite
  retrieved evidence. Keep the deterministic path as fallback. (Provider TBD — check
  the claude-api reference before wiring any Anthropic model.)
- [ ] **Deployment.** Dockerfile + a way to ship/mount the 6 GB `index.sqlite`
  (build-once, serve-many). Add `--workers 1` note (single-connection constraint).
- [ ] **API hardening.** Auth, rate limiting, request logging — the API is dev-only
  today (no auth, wide-open CORS).

## Asks still open for the extraction teammate
(from `CLAUDE.md` — parameters is now ✅ in this index)
1. ✅ Persist `parameters.jsonl` — done (696 234 params indexed).
2. ⬜ Emit `claims.jsonl` → unlocks Mode A + real contradictions.
3. ⬜ Confirm signal-vs-noise relation types (stop-list for `MENTIONED_WITH` etc.).
4. ⬜ Confirm `entity_id ↔ type` stability + hand over the canonical entity map.
5. ⬜ Fix mojibake at source if feasible (we repair defensively meanwhile).
6. ⬜ Confirm `year`/`geography` coverage on documents (scenario 3 depends on it).

## Definition of done (integration milestone)
Index serves with flat RAM → three scenarios return sourced `SearchResult`s →
numeric fallback/structured fires on desalination → graph + (tuned) contradictions
render on catholyte → `year` filter works on pgm → `tests_run` + `api_smoke` green →
fresh `sample_*_server.json` handed to frontend.
