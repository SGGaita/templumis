"""Canonical product modules and per-role staff sidebar access."""

from __future__ import annotations

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

STAFF_ACCESS_ROLES = (
    "vice_chancellor",
    "registrar",
    "scholarship_office",
    "student_services",
    "research_office",
)

# Controllable staff sidebar items per module (paths used for grants + route guards)
STAFF_MODULE_NAV_ITEMS: dict[str, list[dict[str, Any]]] = {
    "enrollment": [
        {"id": "at_risk", "path": "/staff/at-risk"},
        {
            "id": "students",
            "path": "/staff/students",
            "match_prefixes": ["/staff/enrollment"],
        },
    ],
    "support": [
        {"id": "support", "path": "/staff/support"},
    ],
    "scholarships": [
        {"id": "scholarships", "path": "/staff/scholarships"},
        {"id": "financial_aid", "path": "/staff/financial-aid"},
        {"id": "applications", "path": "/staff/scholarships/applications"},
        {"id": "triage", "path": "/staff/scholarships/triage"},
        {"id": "decisions", "path": "/staff/scholarships/decisions"},
        {"id": "opportunities", "path": "/staff/scholarships/opportunities"},
        {"id": "configure", "path": "/staff/scholarships/configure"},
    ],
    "grants": [
        {"id": "grants", "path": "/staff/grants"},
        {"id": "lifecycle", "path": "/staff/grants/lifecycle"},
        {"id": "applications", "path": "/staff/grants/applications"},
        {"id": "opportunities", "path": "/staff/grants/opportunities"},
        {"id": "configure", "path": "/staff/grants/configure"},
    ],
    "rankings": [
        {"id": "rankings", "path": "/staff/rankings"},
    ],
}

FULL_MODULE = "*"

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


def _role_value(role: Any) -> str:
    if hasattr(role, "value"):
        return str(role.value)
    return str(role or "")


def module_item_paths(module_id: str) -> list[str]:
    return [str(item["path"]) for item in STAFF_MODULE_NAV_ITEMS.get(module_id, [])]


def _path_matches_item(pathname: str, item: dict[str, Any]) -> bool:
    path = str(item.get("path") or "")
    if not path or not pathname:
        return False
    if pathname == path or pathname.startswith(f"{path}/"):
        return True
    for prefix in item.get("match_prefixes") or []:
        prefix = str(prefix)
        if pathname == prefix or pathname.startswith(f"{prefix}/"):
            return True
    return False


def find_staff_nav_item(pathname: str) -> dict[str, Any] | None:
    """Most specific catalog item for a staff path."""
    matches: list[tuple[int, str, dict[str, Any]]] = []
    for module_id, items in STAFF_MODULE_NAV_ITEMS.items():
        for item in items:
            if _path_matches_item(pathname, item):
                matches.append((len(str(item["path"])), module_id, item))
    if not matches:
        return None
    matches.sort(key=lambda row: row[0], reverse=True)
    _, module_id, item = matches[0]
    return {"module": module_id, "item": item}


def _normalize_module_grant(value: Any, module_id: str) -> Any:
    paths = module_item_paths(module_id)
    path_set = set(paths)
    if value == FULL_MODULE or value == "all" or value is True:
        return FULL_MODULE
    if isinstance(value, list):
        seen: list[str] = []
        for entry in value:
            if isinstance(entry, str) and entry in path_set and entry not in seen:
                seen.append(entry)
        # Preserve catalog order
        ordered = [p for p in paths if p in set(seen)]
        if not ordered:
            return []
        if len(ordered) == len(paths):
            return FULL_MODULE
        return ordered
    return []


def _legacy_modules_list_to_grants(modules: list[str], ceiling: list[str]) -> dict[str, Any]:
    ceiling_set = set(ceiling)
    out: dict[str, Any] = {}
    for module_id in STAFF_MODULE_IDS:
        if module_id in ceiling_set and module_id in modules:
            out[module_id] = FULL_MODULE
        else:
            out[module_id] = []
    return out


def default_role_grants(ceiling: list[str]) -> dict[str, Any]:
    ceiling_set = set(ceiling)
    return {
        module_id: (FULL_MODULE if module_id in ceiling_set else [])
        for module_id in STAFF_MODULE_IDS
    }


def normalize_staff_role_modules(
    raw: Any,
    enabled_staff: list[str] | None = None,
) -> dict[str, dict[str, Any]]:
    """
    Per-role grants:
      { role: { moduleId: "*" | [paths...] } }

    Legacy shape { role: ["enrollment", "rankings"] } means full access to those modules.
    Missing role keys default to full access for every institution-enabled module.
    """
    ceiling = list(enabled_staff) if enabled_staff is not None else list(STAFF_MODULE_IDS)
    ceiling = [m for m in STAFF_MODULE_IDS if m in set(ceiling)]
    out = {role: default_role_grants(ceiling) for role in STAFF_ACCESS_ROLES}
    if not isinstance(raw, dict):
        return out

    for role in STAFF_ACCESS_ROLES:
        entry = raw.get(role)
        if entry is None:
            continue
        if isinstance(entry, list):
            # Legacy: list of module ids
            modules = [m for m in entry if isinstance(m, str)]
            grants = _legacy_modules_list_to_grants(modules, ceiling)
        elif isinstance(entry, dict):
            grants = default_role_grants([])  # start empty, then fill
            for module_id in STAFF_MODULE_IDS:
                if module_id not in ceiling:
                    grants[module_id] = []
                    continue
                if module_id not in entry:
                    # Unspecified module in new format → no access (explicit grants only)
                    # But if the dict is empty, treat as default full? Prefer: missing key = full when
                    # migrating from partial saves. Safer UX: missing key keeps previous default full
                    # only when role entry was absent entirely. Here entry exists → missing module = off
                    grants[module_id] = _normalize_module_grant(entry.get(module_id, []), module_id)
                else:
                    grants[module_id] = _normalize_module_grant(entry[module_id], module_id)
            # Clip to ceiling
            for module_id in STAFF_MODULE_IDS:
                if module_id not in ceiling:
                    grants[module_id] = []
        else:
            continue
        out[role] = grants
    return out


def modules_from_role_grants(grants: dict[str, Any] | None) -> list[str]:
    if not isinstance(grants, dict):
        return []
    enabled: list[str] = []
    for module_id in STAFF_MODULE_IDS:
        value = grants.get(module_id)
        if value == FULL_MODULE:
            enabled.append(module_id)
        elif isinstance(value, list) and value:
            enabled.append(module_id)
    return enabled


def role_allows_staff_path(grants: dict[str, Any] | None, pathname: str) -> bool:
    """True if grants allow this staff path (or path is outside the catalog)."""
    match = find_staff_nav_item(pathname)
    if not match:
        return True
    if not isinstance(grants, dict):
        return True
    module_id = match["module"]
    item_path = str(match["item"]["path"])
    value = grants.get(module_id)
    if value == FULL_MODULE:
        return True
    if isinstance(value, list):
        return item_path in value
    return False


def effective_enabled_modules_for_user(
    institution_modules: Any,
    staff_role_modules: Any,
    role: Any,
    account_category: str | None = None,
) -> dict[str, list[str]]:
    """Institution modules intersected with this user's role grants (staff roles only)."""
    base = normalize_enabled_modules(institution_modules)
    role_key = _role_value(role)
    if role_key not in STAFF_ACCESS_ROLES:
        return base
    role_map = normalize_staff_role_modules(staff_role_modules, base["staff"])
    return {
        "student": list(base["student"]),
        "staff": modules_from_role_grants(role_map.get(role_key)),
    }


def effective_staff_role_access_for_user(
    institution_modules: Any,
    staff_role_modules: Any,
    role: Any,
) -> dict[str, Any] | None:
    """Granular grants for the current staff role, or None when not a configurable role."""
    role_key = _role_value(role)
    if role_key not in STAFF_ACCESS_ROLES:
        return None
    base = normalize_enabled_modules(institution_modules)
    role_map = normalize_staff_role_modules(staff_role_modules, base["staff"])
    return role_map.get(role_key)
