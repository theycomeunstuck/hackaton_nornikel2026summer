"""No-pytest test runner (the sandbox may lack pytest).

    python -m backend.tests_run
"""
from __future__ import annotations

import importlib.util
import traceback
from pathlib import Path


def main() -> int:
    path = Path(__file__).resolve().parent / "tests" / "test_mode_b.py"
    spec = importlib.util.spec_from_file_location("test_mode_b", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    ok = fail = 0
    for name in sorted(n for n in dir(mod) if n.startswith("test_")):
        try:
            getattr(mod, name)()
            print("PASS", name)
            ok += 1
        except Exception:
            fail += 1
            print("FAIL", name)
            traceback.print_exc()
    print(f"\n{ok} passed, {fail} failed")
    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
