import sys
from datetime import date
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "demo"))

import make_demo_files  # noqa: E402


@pytest.fixture(scope="session")
def demo_dir(tmp_path_factory):
    """The four fictitious supplier files, generated fresh for the test run."""
    out = tmp_path_factory.mktemp("incoming")
    make_demo_files.OUT = out
    make_demo_files.main(seed=11, base=date(2026, 4, 20))
    return out


@pytest.fixture(scope="session")
def mappings_dir():
    return ROOT / "mappings"
