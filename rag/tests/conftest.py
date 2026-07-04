"""Put the repo root (parent of ``backend/``) on sys.path so
``import backend...`` works no matter where pytest is invoked from."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
