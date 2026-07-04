"""Mode-B tests. Run with real pytest or the bundled runner:

    python -m backend.tests_run          # no pytest needed
    pytest backend/tests -q              # if pytest is installed

Uses only the tiny fixtures (never the multi-GB archive). Two ephemeral indexes
are built once at import: one WITHOUT parameters.jsonl and one WITH it.
"""
import os
import shutil
import tempfile
import types

from backend.analytics.gaps import detect_gaps
from backend.contracts import EvidenceItem, ParsedQuery, SearchHit, SourceRef
from backend.graph.graph_build import build_graph
from backend.index import build, fts_match_query
from backend.loader import iter_jsonl
from backend.numeric import condition_interval, extract_conditions, intervals_overlap
from backend.retrieval.fusion import rrf_merge
from backend.retrieval.pipeline import Engine

FX = os.path.join(os.path.dirname(__file__), "..", "data", "fixtures")
DESAL = "Какие методы обессоливания воды, если сухой остаток ≤1000 мг/дм³?"
_FILES = ["chunks.jsonl", "documents.jsonl", "entities.jsonl", "relations.jsonl",
          "mentions.jsonl", "synonyms.json"]


def _assemble(with_params: bool) -> tuple[str, str]:
    d = tempfile.mkdtemp(prefix="modeb_")
    for f in _FILES:
        shutil.copy(os.path.join(FX, f), os.path.join(d, f))
    if with_params:
        shutil.copy(os.path.join(FX, "parameters_sample.jsonl"),
                    os.path.join(d, "parameters.jsonl"))
    db = os.path.join(d, "idx.sqlite")
    build(d, db, with_mentions=True, verbose=False)
    return db, d


_DB, _ROOT = _assemble(False)
ENG = Engine(_DB, _ROOT)
_DBP, _ROOTP = _assemble(True)
ENGP = Engine(_DBP, _ROOTP)


# --- SearchResult shape -----------------------------------------------------
def test_search_result_shape():
    api = ENG.search(DESAL).to_api()
    assert set(api) == {"parsedQuery", "answer", "evidence", "graph",
                        "gaps", "contradictions", "sources"}
    assert set(api["graph"]) == {"nodes", "edges"}
    assert set(api["answer"]) >= {"shortConclusion", "confidence", "warnings", "numericMode"}
    if api["evidence"]:
        src = api["evidence"][0]["source"]
        for k in ("documentId", "sourceName", "chunkId", "page"):
            assert k in src, k


# --- source propagation -----------------------------------------------------
def test_source_propagation():
    r = ENG.search("католит электроэкстракция никеля скорость")
    assert r.evidence
    for e in r.evidence:
        ch = ENG.index.get_chunk(e.source.chunk_id)
        assert ch is not None
        assert e.source.document_id == ch["document_id"]
        assert e.source.source_name == ch["source_name"]
        assert e.source.page == ch["page"]
    # sources list mirrors evidence sources, no dropped fields
    for s in r.sources:
        assert s.document_id and s.chunk_id and s.source_name


# --- FTS / lexical ----------------------------------------------------------
def test_fts_search():
    hits = ENG.index.search_chunks(["католит", "электроэкстракция", "никеля"], k=10)
    ids = [h.chunk_id for h in hits]
    assert "doc_cat_w_p12_c1" in ids or "doc_cat_ru_p5_c1" in ids
    assert all(h.origin == "fts" for h in hits)
    assert fts_match_query([]) == ""             # empty guard
    assert ENG.index.search_chunks([], k=5) == []


# --- RRF --------------------------------------------------------------------
def test_rrf_merge():
    a = [SearchHit("a"), SearchHit("b"), SearchHit("c")]
    b = [SearchHit("c"), SearchHit("a"), SearchHit("z")]
    fused = rrf_merge(a, b)
    ids = [h.chunk_id for h in fused]
    assert set(ids[:2]) == {"a", "c"}            # items in both lists win
    assert [h.chunk_id for h in rrf_merge(a, [])] == \
           [h.chunk_id for h in rrf_merge(a, [])]  # deterministic
    assert rrf_merge([], []) == []               # single active channel / empty


# --- gaps (unit, deterministic) --------------------------------------------
def _ev(doc, geo, stype, conf="medium"):
    return EvidenceItem(id="ev_" + doc, text="текст", score=1.0, confidence=conf,
                        source=SourceRef(document_id=doc, source_name=doc + ".pdf",
                                         chunk_id=doc + "_c1", page=1,
                                         source_type=stype, geography=geo))


def test_gaps_zero_and_one():
    pq = ParsedQuery(raw="q")
    assert any(g.type == "knowledge_gap" for g in detect_gaps(pq, [], "none"))
    one = detect_gaps(pq, [_ev("d", "domestic", "internal_report")], "none")
    assert any(g.type == "weak_coverage" for g in one)


def test_gap_geographic_and_evidence():
    pq = ParsedQuery(raw="q")
    dom = [_ev("d1", "domestic", "publication"), _ev("d2", "domestic", "publication")]
    types_ = {g.type for g in detect_gaps(pq, dom, "none")}
    assert "geographic_gap" in types_       # only domestic
    assert "evidence_gap" in types_         # no experiment/internal report


def test_gap_missing_numeric():
    pq = ParsedQuery(raw="q", conditions=extract_conditions("≤1000 мг/дм³"))
    gaps = detect_gaps(pq, [_ev("d", "domestic", "internal_report")], "approximate")
    assert any(g.type == "missing_numeric_data" for g in gaps)


# --- graph limits + sourced edges ------------------------------------------
def test_graph_limit():
    chunk_ids = ["doc_cat_w_p12_c1", "doc_flot_ru_p15_c1", "doc_flot_w_p9_c1",
                 "doc_pgm_new_p4_c1"]
    g = build_graph(ENG.index, chunk_ids, ENG.entities, max_nodes=3, max_edges=2)
    assert len(g.nodes) <= 3 and len(g.edges) <= 2
    node_ids = {n.id for n in g.nodes}
    for e in g.edges:
        assert e.source in node_ids and e.target in node_ids   # no dangling
        assert e.source_ref is not None and e.source_ref.chunk_id  # sourced
    # full graph still bounded and never the whole DB
    big = build_graph(ENG.index, chunk_ids, ENG.entities)
    assert len(big.nodes) <= 30 and len(big.edges) <= 50


# --- optional parameters: fallback vs structured ---------------------------
def test_numeric_fallback_without_params():
    assert not ENG.index.has_parameters()
    r = ENG.search(DESAL)
    assert r.answer.numeric_mode == "approximate"
    assert r.parsed_query.conditions               # query numbers were parsed
    assert any("приблизительно" in w.lower() for w in r.answer.warnings)
    assert r.evidence                              # fallback still returns evidence


def test_numeric_structured_with_params():
    assert ENGP.index.has_parameters()
    r = ENGP.search(DESAL)
    assert r.answer.numeric_mode == "structured"
    assert any(e.numeric_status == "structured" for e in r.evidence)


# --- numeric interval logic -------------------------------------------------
def test_interval_logic():
    assert intervals_overlap((0.3, 0.5), (0.4, 0.9))
    assert not intervals_overlap((0.3, 0.5), (0.8, 1.2))
    c = extract_conditions("≤1000 мг/дм³")[0]
    assert condition_interval(c) == (float("-inf"), 1000.0)


# --- contradictions (Mode B degraded) --------------------------------------
def test_catholyte_contradiction_is_sourced():
    r = ENG.search("скорость потока католита при электроэкстракции никеля")
    assert r.contradictions, "expected a flow-speed disagreement"
    for c in r.contradictions:
        assert c.source_a.chunk_id and c.source_b.chunk_id
        assert c.status in ("possible", "needs_review", "confirmed")


def test_subject_qualified_numeric_contradiction():
    """Same-subject numeric contradictions are RECOVERED when the parameter name
    carries a subject ("содержание железа"), while cross-subject and bare-generic
    numbers are NOT compared (no false positives). See analytics/contradictions.py.
    """
    sub = os.path.join(FX, "subject")
    db = os.path.join(tempfile.mkdtemp(prefix="subj_"), "idx.sqlite")
    build(sub, db, with_mentions=False, verbose=False)
    eng = Engine(db, sub)
    r = eng.search("содержание железа в штейне и донной фазе")

    fe = [c for c in r.contradictions if "желез" in c.title.lower()]
    assert fe, "expected the same-subject (Fe) contradiction to be recovered"
    for c in fe:
        assert c.source_a.document_id != c.source_b.document_id  # cross-document
        assert c.source_a.chunk_id and c.source_b.chunk_id        # sourced
        assert c.status == "needs_review"
    # no cross-subject false positive: Fe never compared against Si, and the bare
    # "содержание 99 %" is never compared against anything.
    for c in r.contradictions:
        d = c.description.lower()
        assert not ("желез" in d and "кремни" in d), "Fe wrongly compared to Si"
        assert "99" not in d, "bare 'содержание' wrongly compared"
    eng.close()


# --- streaming loader is lazy (does not read whole file) --------------------
def test_streaming_loader_is_generator():
    g = iter_jsonl(os.path.join(FX, "chunks.jsonl"))
    assert isinstance(g, types.GeneratorType)
    assert "chunk_id" in next(g)
