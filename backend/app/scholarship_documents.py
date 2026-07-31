"""Persist scholarship application supporting documents on disk."""

from __future__ import annotations

import re
import uuid
from pathlib import Path
from typing import Optional

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
UPLOAD_ROOT = _BACKEND_ROOT / "data" / "uploads" / "scholarships"

ALLOWED_MIME = frozenset({"application/pdf", "image/png", "image/jpeg"})
MAX_BYTES = 10 * 1024 * 1024


def _safe_filename(name: str) -> str:
    base = Path(name or "document").name
    base = re.sub(r"[^\w.\- ]", "_", base).strip() or "document"
    return base[:180]


def document_dir(student_number: str, scholarship_external_id: str) -> Path:
    safe_student = re.sub(r"[^\w\-]", "_", str(student_number))
    safe_schol = re.sub(r"[^\w\-]", "_", str(scholarship_external_id))
    return UPLOAD_ROOT / safe_student / safe_schol


def storage_path(student_number: str, scholarship_external_id: str, storage_key: str) -> Path:
    return document_dir(student_number, scholarship_external_id) / storage_key


def save_document(
    student_number: str,
    scholarship_external_id: str,
    *,
    filename: str,
    content: bytes,
    mime: str,
) -> dict:
    if len(content) > MAX_BYTES:
        raise ValueError("File must be ≤ 10 MB")
    if mime not in ALLOWED_MIME:
        raise ValueError("Only PDF, PNG, or JPEG allowed")

    dest_dir = document_dir(student_number, scholarship_external_id)
    dest_dir.mkdir(parents=True, exist_ok=True)

    storage_key = f"{uuid.uuid4().hex}_{_safe_filename(filename)}"
    path = dest_dir / storage_key
    path.write_bytes(content)

    return {
        "name": _safe_filename(filename),
        "mime": mime,
        "size_mb": round(len(content) / (1024 * 1024), 2),
        "storage_key": storage_key,
        "integrity_ok": True,
    }


def delete_document(student_number: str, scholarship_external_id: str, storage_key: str) -> bool:
    path = storage_path(student_number, scholarship_external_id, storage_key)
    if path.is_file():
        path.unlink()
        return True
    return False


def resolve_document(
    student_number: str,
    scholarship_external_id: str,
    storage_key: str,
) -> Optional[Path]:
    if not storage_key or ".." in storage_key or "/" in storage_key or "\\" in storage_key:
        return None
    path = storage_path(student_number, scholarship_external_id, storage_key)
    if path.is_file():
        return path
    return None


def previewable(storage_key: Optional[str]) -> bool:
    return bool(storage_key)
