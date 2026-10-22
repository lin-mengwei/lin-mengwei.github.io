import os
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

DEFAULT_SOURCE = Path(r"C:\Users\51585\Dropbox\应用\Overleaf\BESTEPS Lectures (Copy_Mw)\Print.tex")


@pytest.fixture(scope="session")
def real_source() -> str:
    """The real Print.tex; tests that need it are skipped when it is absent."""
    path = Path(os.environ.get("BESTEPS_TEX", DEFAULT_SOURCE))
    if not path.exists():
        pytest.skip(f"source not found: {path}")
    return path.read_text(encoding="utf-8")
