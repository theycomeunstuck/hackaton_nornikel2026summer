"""Loaders and path resolution. The seam to the extraction teammate's output.

Rules (see CLAUDE.md):
  * documents / entities / synonyms  -> small, loaded into RAM.
  * chunks / mentions / relations     -> HUGE, exposed only as STREAMING
    generators (used by the index builder), never returned as lists.
  * parameters.jsonl                  -> OPTIONAL; auto-discovered; may be absent.

Nothing here opens a multi-GB file in full.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Iterator, Optional

from .normalize import normalize_term

# Candidate relative locations for each logical file, tried in order. Supports
# both the real archive layout (data/processed, data/extracted[_with_params])
# and a flat fixtures layout.
_CANDIDATES = {
    "chunks": ["chunks.jsonl", "data/processed/chunks.jsonl"],
    "documents": ["documents.jsonl", "data/processed/documents.jsonl"],
    "entities": ["entities.jsonl", "data/extracted/entities.jsonl"],
    "mentions": ["mentions.jsonl", "data/extracted/mentions.jsonl"],
    "relations": ["relations.jsonl", "data/extracted/relations.jsonl"],
    "synonyms": ["synonyms.json", "data/extracted/synonyms.json"],
    # parameters: prefer the params-enabled run, fall back to plain extracted.
    "parameters": ["parameters.jsonl",
                   "data/extracted_with_params/parameters.jsonl",
                   "data/extracted/parameters.jsonl"],
}


def resolve(data_root: str | Path, kind: str) -> Optional[Path]:
    """Return the first existing candidate path for ``kind`` under data_root."""
    root = Path(data_root)
    for rel in _CANDIDATES[kind]:
        p = root / rel
        if p.exists():
            return p
    return None


# --- streaming ---------------------------------------------------------------
def iter_jsonl(path: str | Path) -> Iterator[dict]:
    """Yield one dict per line. Tolerant of blank/broken lines (skips them)."""
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


# --- in-RAM (small files only) ----------------------------------------------
def load_documents(path: str | Path) -> dict[str, dict]:
    """document_id -> document record. ~2k rows."""
    out: dict[str, dict] = {}
    for d in iter_jsonl(path):
        did = d.get("document_id")
        if did:
            out[did] = d
    return out


class Entities:
    """In-RAM entity store (~44k). Provides id lookup and alias matching."""

    def __init__(self) -> None:
        self.by_id: dict[str, dict] = {}
        self.alias_index: dict[str, list[str]] = {}   # normalized surface -> [entity_id]

    @classmethod
    def load(cls, path: str | Path) -> "Entities":
        self = cls()
        for e in iter_jsonl(path):
            eid = e.get("entity_id")
            if not eid:
                continue
            self.by_id[eid] = e
            surfaces = [e.get("canonical_name", "")] + list(e.get("aliases", []))
            for s in surfaces:
                key = normalize_term(s)
                if not key or key.startswith("numeric_value") or ":" in key:
                    continue  # skip the noisy numeric "Condition" entities
                self.alias_index.setdefault(key, [])
                if eid not in self.alias_index[key]:
                    self.alias_index[key].append(eid)
        return self

    def type_of(self, entity_id: str) -> str:
        ent = self.by_id.get(entity_id)
        if ent and ent.get("type"):
            return ent["type"]
        # entity_id encodes the type: ent_<type>_<hash>
        parts = entity_id.split("_")
        return parts[1].capitalize() if len(parts) >= 3 else "Unknown"

    def name_of(self, entity_id: str) -> str:
        ent = self.by_id.get(entity_id)
        return ent.get("canonical_name", entity_id) if ent else entity_id


def load_synonyms(path: str | Path | None) -> dict[str, list[str]]:
    """Flat {canonical: [aliases]}. Drops the noisy numeric_value:* junk keys."""
    if path is None or not Path(path).exists():
        return {}
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    out: dict[str, list[str]] = {}
    for name, aliases in raw.items():
        key = normalize_term(name)
        if not key or key.startswith("numeric_value") or ":" in name:
            continue
        out[name] = list(aliases)
    return out
