"""Dependency-free smoke check for the HTTP API (backend.api).

Boots the real ASGI app in-process (uvicorn on a background thread) and hits
every endpoint with stdlib urllib. No httpx / pytest required.

    python -m backend.api_smoke

Requires the prebuilt index at RAG_DB_PATH (default backend/data/index.sqlite).
Exits non-zero on any failure; skips (exit 0) if the index is absent.
"""
from __future__ import annotations

import json
import sys
import threading
import time
import urllib.request
from pathlib import Path

from . import api

BASE = "http://127.0.0.1:8123"
_SEARCHRESULT_KEYS = {"parsedQuery", "answer", "evidence", "graph",
                      "gaps", "contradictions", "sources"}


def _get(path: str, method: str = "GET", body: dict | None = None) -> dict:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _wait_ready(timeout: float = 60.0) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            if _get("/api/health").get("status") == "ok":
                return
        except Exception:
            time.sleep(0.3)
    raise RuntimeError("server did not become ready in time")


def main() -> int:
    if not Path(api.RAG_DB_PATH).exists():
        print(f"SKIP: index not found at {api.RAG_DB_PATH}")
        return 0

    import uvicorn
    config = uvicorn.Config(api.app, host="127.0.0.1", port=8123, log_level="warning")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    ok = fail = 0
    try:
        _wait_ready()

        # 1. health
        assert _get("/api/health") == {"status": "ok"}, "health payload"
        print("PASS  /api/health"); ok += 1

        # 2. stats
        st = _get("/api/stats")
        assert isinstance(st, dict) and "chunk_count" in st, f"stats: {st}"
        print(f"PASS  /api/stats  (chunks={st.get('chunk_count')})"); ok += 1

        # 3. demo endpoints -> SearchResult with the frozen top-level keys
        for scenario in ("desalination", "catholyte", "pgm"):
            res = _get(f"/api/demo/{scenario}")
            missing = _SEARCHRESULT_KEYS - set(res)
            assert not missing, f"{scenario} missing keys: {missing}"
            print(f"PASS  /api/demo/{scenario}  (evidence={len(res['evidence'])})"); ok += 1

        # 4. POST /api/search
        res = _get("/api/search", method="POST",
                   body={"query": SCENARIO_QUERY, "topK": 15})
        missing = _SEARCHRESULT_KEYS - set(res)
        assert not missing, f"search missing keys: {missing}"
        print(f"PASS  /api/search  (evidence={len(res['evidence'])})"); ok += 1

        # 5. unknown scenario -> 404
        try:
            _get("/api/demo/nope")
            raise AssertionError("expected 404 for unknown scenario")
        except urllib.error.HTTPError as e:
            assert e.code == 404, f"expected 404, got {e.code}"
        print("PASS  /api/demo/<bad> -> 404"); ok += 1
    except Exception as e:
        fail += 1
        print(f"FAIL  {e}")
    finally:
        server.should_exit = True

    print(f"\n{ok} passed, {fail} failed")
    return 1 if fail else 0


SCENARIO_QUERY = ("Какая скорость потока католита оптимальна при "
                  "электроэкстракции никеля?")

if __name__ == "__main__":
    raise SystemExit(main())
