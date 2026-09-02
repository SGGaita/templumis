"""Persist institution logos on disk and resolve public URLs."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
UPLOAD_ROOT = _BACKEND_ROOT / "data" / "uploads" / "institution-logos"

ALLOWED_MIME = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
}
MAX_BYTES = 2 * 1024 * 1024
MIME_BY_SUFFIX = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


def public_path(institution_id: int) -> str:
    return f"/api/public/institution-logo/{int(institution_id)}"


def logo_dir(institution_id: int) -> Path:
    return UPLOAD_ROOT / str(int(institution_id))


def resolve_logo(institution_id: int) -> Optional[Path]:
    dest = logo_dir(institution_id)
    if not dest.is_dir():
        return None
    for name in ("logo.webp", "logo.png", "logo.jpg", "logo.jpeg"):
        path = dest / name
        if path.is_file():
            return path
    files = sorted(p for p in dest.iterdir() if p.is_file())
    return files[0] if files else None


def mime_for(path: Path) -> str:
    return MIME_BY_SUFFIX.get(path.suffix.lower(), "application/octet-stream")


def public_logo_url(institution_id: int, stored_url: str | None = None) -> str | None:
    path = resolve_logo(institution_id)
    if not path and not stored_url:
        return None
    if not path:
        return None
    version = int(path.stat().st_mtime)
    return f"{public_path(institution_id)}?v={version}"


def save_logo(institution_id: int, *, content: bytes, mime: str) -> str:
    normalized = (mime or "").split(";")[0].strip().lower()
    if normalized == "image/jpg":
        normalized = "image/jpeg"
    ext = ALLOWED_MIME.get(normalized)
    if not ext:
        raise ValueError("unsupported_type")
    if len(content) > MAX_BYTES:
        raise ValueError("too_large")
    if not content:
        raise ValueError("empty")

    dest = logo_dir(institution_id)
    dest.mkdir(parents=True, exist_ok=True)
    for existing in dest.iterdir():
        if existing.is_file():
            existing.unlink()

    path = dest / f"logo{ext}"
    path.write_bytes(content)
    return public_path(institution_id)


def delete_logo(institution_id: int) -> bool:
    dest = logo_dir(institution_id)
    removed = False
    if dest.is_dir():
        for existing in dest.iterdir():
            if existing.is_file():
                existing.unlink()
                removed = True
        try:
            dest.rmdir()
        except OSError:
            pass
    return removed
