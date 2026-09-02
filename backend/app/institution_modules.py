"""Canonical product modules that global admins can enable per institution."""

from typing import Any

ALL_MODULE_IDS = (
    "enrollment",
    "scholarships",
    "support",
    "grants",
    "rankings",
)

STUDENT_MODULE_IDS = (
    "enrollment",
    "scholarships",
    "support",
    "grants",
)

STAFF_MODULE_IDS = ALL_MODULE_IDS

DEFAULT_ENABLED_MODULES = {
    "student": list(STUDENT_MODULE_IDS),
    "staff": list(STAFF_MODULE_IDS),
}

_ALLOWED_BY_PORTAL = {
    "student": set(STUDENT_MODULE_IDS),
    "staff": set(STAFF_MODULE_IDS),
}


def default_enabled_modules() -> dict[str, list[str]]:
    return {
        "student": list(STUDENT_MODULE_IDS),
        "staff": list(STAFF_MODULE_IDS),
    }


def normalize_enabled_modules(raw: Any) -> dict[str, list[str]]:
    """Treat missing/legacy null as all modules enabled."""
    if not isinstance(raw, dict):
        return default_enabled_modules()
    out = default_enabled_modules()
    for portal, allowed in _ALLOWED_BY_PORTAL.items():
        items = raw.get(portal)
        if not isinstance(items, list):
            continue
        seen: list[str] = []
        for item in items:
            if isinstance(item, str) and item in allowed and item not in seen:
                seen.append(item)
        out[portal] = seen
    return out


def is_module_enabled(raw: Any, portal: str, module_id: str) -> bool:
    enabled = normalize_enabled_modules(raw)
    return module_id in enabled.get(portal, [])
