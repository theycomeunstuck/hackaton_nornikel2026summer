"""SQLite index over the extraction archive. Stdlib only (sqlite3 + FTS5).

The giant JSONL files (chunks 2.3 GB, relations 2.1 GB, mentions 3.1 GB) are
STREAMED into on-disk SQLite tables — never held in RAM. Retrieval then queries
the index (milliseconds) instead of the raw files.

Build (dev, fast):   python -m backend.index build --data-root <dir> --db index.sqlite --limit 20000
Build (full, slow):  python -m backend.index build --data-root <dir> --db index.sqlite
Stats:               python -m backend.index stats --db index.sqlite

Tables:
  chunks(id, chunk_id, document_id, source_name, page, year, source_type,
         geography, language, section_title, text)
  chunks_fts(text, contextual_text)                 -- FTS5, rowid == chunks.id
  relations(relation_id, source_entity_id, target_entity_id, type, chunk_id,
            document_id, evidence_text, confidence, page, source_name)
  mentions(mention_id, entity_id, chunk_id, document_id, surface_text,
           sentence, page, source_name)             -- optional
  parameters(chunk_id, name, operator, min, max, value, unit, raw_value)  -- optional
  meta(key, value)
"""
from __future__ import annotations

import argparse
import re
import sqlite3
import sys
import time
from pathlib import Path
from typing import Iterator, Optional

from .contracts import SearchHit
from .loader import iter_jsonl, resolve
from .normalize import repair_mojibake

_BATCH = 2000
_TOKEN = re.compile(r"[\wёЁ][\wёЁ/.\-]*", re.UNICODE)


# ===========================================================================
# Build
# ===========================================================================
def _schema(con: sqlite3.Connection) -> None:
    con.executescript(
        """
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY,
            chunk_id TEXT UNIQUE, document_id TEXT, source_name TEXT, page INTEGER,
            year INTEGER, source_type TEXT, geography TEXT, language TEXT,
            section_title TEXT, text TEXT
        );
        CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(text, contextual_text);
        CREATE TABLE IF NOT EXISTS relations (
            relation_id TEXT, source_entity_id TEXT, target_entity_id TEXT, type TEXT,
            chunk_id TEXT, document_id TEXT, evidence_text TEXT, confidence REAL,
            page INTEGER, source_name TEXT
        );
        CREATE TABLE IF NOT EXISTS mentions (
            mention_id TEXT, entity_id TEXT, chunk_id TEXT, document_id TEXT,
            surface_text TEXT, sentence TEXT, page INTEGER, source_name TEXT
        );
        CREATE TABLE IF NOT EXISTS parameters (
            chunk_id TEXT, name TEXT, operator TEXT, min REAL, max REAL,
            value REAL, unit TEXT, raw_value TEXT
        );
        CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
        """
    )


def _set_meta(con: sqlite3.Connection, key: str, value) -> None:
    con.execute("INSERT OR REPLACE INTO meta(key, value) VALUES(?, ?)", (key, str(value)))


def _stream_filtered(path: Path, allowed: Optional[set], id_field: str,
                     scan_cap: Optional[int]) -> Iterator[dict]:
    """Yield rows from a JSONL file, optionally keeping only those whose
    ``id_field`` is in ``allowed``, and stopping after ``scan_cap`` lines read."""
    scanned = 0
    for row in iter_jsonl(path):
        scanned += 1
        if scan_cap is not None and scanned > scan_cap:
            break
        if allowed is not None and row.get(id_field) not in allowed:
            continue
        yield row


def build(data_root: str | Path, db_path: str | Path, *, limit: Optional[int] = None,
          with_mentions: bool = False, scan_cap: Optional[int] = None,
          repair: bool = True, verbose: bool = True) -> dict:
    """Build the index. Returns a stats dict. Idempotent-ish: drops & recreates."""
    data_root = Path(data_root)
    db_path = Path(db_path)
    if db_path.exists():
        db_path.unlink()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    chunks_path = resolve(data_root, "chunks")
    if chunks_path is None:
        raise FileNotFoundError(f"chunks.jsonl not found under {data_root}")
    rel_path = resolve(data_root, "relations")
    men_path = resolve(data_root, "mentions")
    par_path = resolve(data_root, "parameters")

    if limit and scan_cap is None:
        scan_cap = max(200_000, limit * 100)   # bound dev-build time on huge files

    con = sqlite3.connect(str(db_path))
    con.execute("PRAGMA journal_mode=OFF")
    con.execute("PRAGMA synchronous=OFF")
    _schema(con)
    t0 = time.monotonic()

    # --- chunks + FTS ------------------------------------------------------
    allowed: Optional[set] = set() if limit else None
    n_chunks = 0
    batch_meta, batch_fts = [], []
    for ch in iter_jsonl(chunks_path):
        if limit and n_chunks >= limit:
            break
        cid = ch.get("chunk_id", "")
        if not cid:
            continue
        text = ch.get("text", "") or ""
        ctx = ch.get("contextual_text", "") or ""
        if repair:
            text = repair_mojibake(text)
            ctx = repair_mojibake(ctx)
        n_chunks += 1
        if allowed is not None:
            allowed.add(cid)
        rowid = n_chunks
        batch_meta.append((rowid, cid, ch.get("document_id", ""), ch.get("source_name", ""),
                           _int(ch.get("page")), _int(ch.get("year")), ch.get("source_type", ""),
                           ch.get("geography", ""), ch.get("language", ""),
                           ch.get("section_title", ""), text))
        batch_fts.append((rowid, text, ctx))
        if len(batch_meta) >= _BATCH:
            _flush_chunks(con, batch_meta, batch_fts)
            batch_meta, batch_fts = [], []
            if verbose and n_chunks % 20000 == 0:
                print(f"  chunks {n_chunks} ({time.monotonic()-t0:.0f}s)", file=sys.stderr)
    _flush_chunks(con, batch_meta, batch_fts)
    con.commit()
    if verbose:
        print(f"  chunks done: {n_chunks}", file=sys.stderr)

    # --- relations ---------------------------------------------------------
    n_rel = 0
    if rel_path:
        batch = []
        for r in _stream_filtered(rel_path, allowed, "chunk_id", scan_cap):
            batch.append((r.get("relation_id", ""), r.get("source_entity_id", ""),
                          r.get("target_entity_id", ""), r.get("type", ""),
                          r.get("chunk_id", ""), r.get("document_id", ""),
                          repair_mojibake(r.get("evidence_text", "")) if repair else r.get("evidence_text", ""),
                          _float(r.get("confidence")), _int(r.get("page")), r.get("source_name", "")))
            if len(batch) >= _BATCH:
                con.executemany("INSERT INTO relations VALUES (?,?,?,?,?,?,?,?,?,?)", batch)
                n_rel += len(batch)
                batch = []
        if batch:
            con.executemany("INSERT INTO relations VALUES (?,?,?,?,?,?,?,?,?,?)", batch)
            n_rel += len(batch)
        con.commit()
        if verbose:
            print(f"  relations done: {n_rel}", file=sys.stderr)

    # --- mentions (optional) ----------------------------------------------
    n_men = 0
    if with_mentions and men_path:
        batch = []
        for m in _stream_filtered(men_path, allowed, "chunk_id", scan_cap):
            batch.append((m.get("mention_id", ""), m.get("entity_id", ""),
                          m.get("chunk_id", ""), m.get("document_id", ""),
                          m.get("surface_text", ""), m.get("sentence", ""),
                          _int(m.get("page")), m.get("source_name", "")))
            if len(batch) >= _BATCH:
                con.executemany("INSERT INTO mentions VALUES (?,?,?,?,?,?,?,?)", batch)
                n_men += len(batch)
                batch = []
        if batch:
            con.executemany("INSERT INTO mentions VALUES (?,?,?,?,?,?,?,?)", batch)
            n_men += len(batch)
        con.commit()
        if verbose:
            print(f"  mentions done: {n_men}", file=sys.stderr)

    # --- parameters (optional; the auto-strengthening path) ---------------
    n_par = 0
    if par_path:
        batch = []
        for p in _stream_filtered(par_path, allowed, "chunk_id", scan_cap):
            batch.append((p.get("chunk_id", ""), p.get("name", ""), p.get("operator", "unknown"),
                          _float(p.get("min")), _float(p.get("max")), _float(p.get("value")),
                          p.get("unit", ""), p.get("raw_value", "")))
            if len(batch) >= _BATCH:
                con.executemany("INSERT INTO parameters VALUES (?,?,?,?,?,?,?,?)", batch)
                n_par += len(batch)
                batch = []
        if batch:
            con.executemany("INSERT INTO parameters VALUES (?,?,?,?,?,?,?,?)", batch)
            n_par += len(batch)
        con.commit()
        if verbose:
            print(f"  parameters done: {n_par}", file=sys.stderr)

    # --- indexes + meta ----------------------------------------------------
    con.executescript(
        """
        CREATE INDEX IF NOT EXISTS ix_rel_src ON relations(source_entity_id);
        CREATE INDEX IF NOT EXISTS ix_rel_tgt ON relations(target_entity_id);
        CREATE INDEX IF NOT EXISTS ix_rel_chunk ON relations(chunk_id);
        CREATE INDEX IF NOT EXISTS ix_men_ent ON mentions(entity_id);
        CREATE INDEX IF NOT EXISTS ix_men_chunk ON mentions(chunk_id);
        CREATE INDEX IF NOT EXISTS ix_par_chunk ON parameters(chunk_id);
        """
    )
    _set_meta(con, "chunk_count", n_chunks)
    _set_meta(con, "relation_count", n_rel)
    _set_meta(con, "mention_count", n_men)
    _set_meta(con, "parameter_count", n_par)
    _set_meta(con, "has_parameters", 1 if n_par > 0 else 0)
    _set_meta(con, "has_mentions", 1 if n_men > 0 else 0)
    _set_meta(con, "limited", 1 if limit else 0)
    _set_meta(con, "data_root", str(data_root))
    con.commit()
    con.close()

    stats = {"chunks": n_chunks, "relations": n_rel, "mentions": n_men,
             "parameters": n_par, "has_parameters": n_par > 0,
             "elapsed_sec": round(time.monotonic() - t0, 1), "db": str(db_path)}
    if verbose:
        print(f"BUILD DONE: {stats}", file=sys.stderr)
    return stats


def _flush_chunks(con, batch_meta, batch_fts) -> None:
    if not batch_meta:
        return
    con.executemany(
        "INSERT INTO chunks VALUES (?,?,?,?,?,?,?,?,?,?,?)", batch_meta)
    con.executemany(
        "INSERT INTO chunks_fts(rowid, text, contextual_text) VALUES (?,?,?)", batch_fts)


def _int(x) -> Optional[int]:
    try:
        return int(x)
    except (TypeError, ValueError):
        return None


def _float(x) -> Optional[float]:
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


# ===========================================================================
# Query
# ===========================================================================
def fts_match_query(terms: list[str]) -> str:
    """Build a robust FTS5 MATCH string: OR of individual alnum tokens, quoted.

    Token-level OR (not phrases) maximizes recall on RU/EN mixed text; BM25 does
    the ranking. Returns '' if there is nothing searchable."""
    tokens: list[str] = []
    seen = set()
    for term in terms:
        for tok in _TOKEN.findall(term.lower().replace("ё", "е")):
            if len(tok) < 2 or tok in seen:
                continue
            seen.add(tok)
            tokens.append(tok.replace('"', '""'))
    return " OR ".join(f'"{t}"' for t in tokens)


class Index:
    """Read-side handle over a built index."""

    def __init__(self, db_path: str | Path) -> None:
        self.db_path = str(db_path)
        self.con = sqlite3.connect(f"file:{self.db_path}?mode=ro", uri=True)
        self.con.row_factory = sqlite3.Row

    # -- meta --
    def _meta(self, key: str, default=None):
        row = self.con.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
        return row["value"] if row else default

    def has_parameters(self) -> bool:
        return str(self._meta("has_parameters", "0")) == "1"

    def has_mentions(self) -> bool:
        return str(self._meta("has_mentions", "0")) == "1"

    def stats(self) -> dict:
        return {k: self._meta(k) for k in
                ("chunk_count", "relation_count", "mention_count",
                 "parameter_count", "has_parameters", "limited", "data_root")}

    # -- retrieval --
    def search_chunks(self, terms: list[str], k: int = 40) -> list[SearchHit]:
        match = fts_match_query(terms)
        if not match:
            return []
        sql = (
            "SELECT c.chunk_id, c.document_id, c.source_name, c.page, c.year, "
            "       c.source_type, c.geography, c.section_title, c.text, "
            "       bm25(chunks_fts) AS bm "
            "FROM chunks_fts JOIN chunks c ON c.id = chunks_fts.rowid "
            "WHERE chunks_fts MATCH ? ORDER BY bm LIMIT ?"
        )
        hits = []
        try:
            rows = self.con.execute(sql, (match, k)).fetchall()
        except sqlite3.OperationalError:
            return []
        for r in rows:
            hits.append(SearchHit(
                chunk_id=r["chunk_id"], document_id=r["document_id"],
                source_name=r["source_name"], page=r["page"], text=r["text"] or "",
                score=-(r["bm"] or 0.0), origin="fts", year=r["year"],
                source_type=r["source_type"] or "", geography=r["geography"] or "",
                section_title=r["section_title"] or ""))
        return hits

    def chunks_for_entities(self, entity_ids: list[str], k: int = 20) -> list[SearchHit]:
        """Chunks where the given entities participate in a relation. Second
        (entity-expansion) retrieval channel."""
        if not entity_ids:
            return []
        ph = ",".join("?" * len(entity_ids))
        sql = (
            f"SELECT DISTINCT c.chunk_id, c.document_id, c.source_name, c.page, c.year, "
            f"       c.source_type, c.geography, c.section_title, c.text "
            f"FROM relations r JOIN chunks c ON c.chunk_id = r.chunk_id "
            f"WHERE r.source_entity_id IN ({ph}) OR r.target_entity_id IN ({ph}) "
            f"LIMIT ?"
        )
        rows = self.con.execute(sql, (*entity_ids, *entity_ids, k)).fetchall()
        return [SearchHit(chunk_id=r["chunk_id"], document_id=r["document_id"],
                          source_name=r["source_name"], page=r["page"], text=r["text"] or "",
                          score=0.5, origin="entity", year=r["year"],
                          source_type=r["source_type"] or "", geography=r["geography"] or "",
                          section_title=r["section_title"] or "") for r in rows]

    def relations_for_chunks(self, chunk_ids: list[str], cap: int = 200) -> list[dict]:
        if not chunk_ids:
            return []
        ph = ",".join("?" * len(chunk_ids))
        sql = (
            f"SELECT relation_id, source_entity_id, target_entity_id, type, chunk_id, "
            f"       document_id, evidence_text, confidence, page, source_name "
            f"FROM relations WHERE chunk_id IN ({ph}) "
            f"ORDER BY (type='MENTIONED_WITH') ASC, confidence DESC LIMIT ?"
        )
        return [dict(r) for r in self.con.execute(sql, (*chunk_ids, cap)).fetchall()]

    def parameters_for_chunks(self, chunk_ids: list[str]) -> dict[str, list[dict]]:
        """chunk_id -> [parameter rows]. Empty if no parameters table populated."""
        if not chunk_ids or not self.has_parameters():
            return {}
        ph = ",".join("?" * len(chunk_ids))
        sql = (f"SELECT chunk_id, name, operator, min, max, value, unit, raw_value "
               f"FROM parameters WHERE chunk_id IN ({ph})")
        out: dict[str, list[dict]] = {}
        for r in self.con.execute(sql, tuple(chunk_ids)).fetchall():
            out.setdefault(r["chunk_id"], []).append(dict(r))
        return out

    def get_chunk(self, chunk_id: str) -> Optional[dict]:
        r = self.con.execute("SELECT * FROM chunks WHERE chunk_id=?", (chunk_id,)).fetchone()
        return dict(r) if r else None

    def close(self) -> None:
        self.con.close()


# ===========================================================================
# CLI
# ===========================================================================
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Build/inspect the SQLite index.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("build", help="Build the index from the archive.")
    b.add_argument("--data-root", required=True,
                   help="Dir containing data/processed and data/extracted[_with_params].")
    b.add_argument("--db", required=True, help="Output SQLite path.")
    b.add_argument("--limit", type=int, default=None, help="Index only first N chunks (dev).")
    b.add_argument("--with-mentions", action="store_true", help="Also index mentions (3.1 GB).")
    b.add_argument("--scan-cap", type=int, default=None,
                   help="Max lines to read from each huge file (default: derived when --limit set).")
    b.add_argument("--no-repair", action="store_true", help="Disable mojibake repair.")

    s = sub.add_parser("stats", help="Print index stats.")
    s.add_argument("--db", required=True)

    args = ap.parse_args(argv)
    if args.cmd == "build":
        build(args.data_root, args.db, limit=args.limit, with_mentions=args.with_mentions,
              scan_cap=args.scan_cap, repair=not args.no_repair)
        return 0
    if args.cmd == "stats":
        idx = Index(args.db)
        print(idx.stats())
        idx.close()
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
