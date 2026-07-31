"""Resolve templumis Excel workbook (v2 preferred)."""

from pathlib import Path

EXCEL_FILENAMES = (
    "templumis_university_v2.xlsx",
    "templumis_university.xlsx",
)

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_PROJECT_ROOT = _BACKEND_ROOT.parent

_SEARCH_ROOTS = (
    Path("/data"),
    _PROJECT_ROOT / "data",
    _BACKEND_ROOT / "data",
)


def resolve_excel_path() -> Path:
    for root in _SEARCH_ROOTS:
        for name in EXCEL_FILENAMES:
            candidate = root / name
            if candidate.exists():
                return candidate
    raise FileNotFoundError(
        "Excel workbook not found. Place templumis_university_v2.xlsx in project data/ or mount /data."
    )
