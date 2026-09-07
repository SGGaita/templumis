"""Scope Excel SIS rows to the logged-in user's institution (by domain / name)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional

from sqlalchemy.orm import Session

from app.models import Institution, InstitutionDomain, User

# Demo workbook maps email domains → Institution column values.
DOMAIN_TO_EXCEL_INSTITUTION = {
    "templumis.ac": "Templumis University",
    "kitaptech.com": "Kitaptech University",
    "rongovarsity.ac.ke": "Rongo University",
}

# Common DB / Excel name aliases (normalized lowercase).
NAME_ALIASES = {
    "templum university": "Templumis University",
    "templumis university": "Templumis University",
    "kitaptech university": "Kitaptech University",
    "rongo university": "Rongo University",
    "rongo varsity": "Rongo University",
}


def _norm(value: object) -> str:
    return str(value or "").strip().lower()


def _email_domain(email: object) -> Optional[str]:
    text = str(email or "").strip().lower()
    if "@" not in text:
        return None
    return text.rsplit("@", 1)[-1].strip() or None


def _canonical_excel_name(name: Optional[str]) -> Optional[str]:
    if not name:
        return None
    key = _norm(name)
    if key in NAME_ALIASES:
        return NAME_ALIASES[key]
    # Title-case pass-through for unknown institutions that still match Excel literally.
    return str(name).strip()


@dataclass(frozen=True)
class InstitutionExcelScope:
    """Filter context for multi-institution Excel rows."""

    institution_id: int
    name: Optional[str]
    domains: frozenset[str]
    excel_names: frozenset[str]

    @property
    def is_active(self) -> bool:
        return bool(self.domains or self.excel_names)


def resolve_institution_excel_scope(
    db: Session,
    user: Optional[User],
) -> Optional[InstitutionExcelScope]:
    """
    Build a scope for the current user.

    Returns None when the user has no institution (e.g. platform global admin),
    meaning Excel data should not be institution-filtered.
    """
    if user is None or not getattr(user, "institution_id", None):
        return None

    institution = (
        db.query(Institution)
        .filter(Institution.id == user.institution_id)
        .first()
    )
    domain_rows = (
        db.query(InstitutionDomain)
        .filter(InstitutionDomain.institution_id == user.institution_id)
        .all()
    )
    domains = frozenset(_norm(d.domain) for d in domain_rows if d.domain)
    excel_names: set[str] = set()

    for domain in domains:
        mapped = DOMAIN_TO_EXCEL_INSTITUTION.get(domain)
        if mapped:
            excel_names.add(_norm(mapped))

    if institution and institution.name:
        canonical = _canonical_excel_name(institution.name)
        if canonical:
            excel_names.add(_norm(canonical))
        excel_names.add(_norm(institution.name))

    return InstitutionExcelScope(
        institution_id=user.institution_id,
        name=institution.name if institution else None,
        domains=domains,
        excel_names=frozenset(excel_names),
    )


def row_matches_institution_scope(
    row: dict,
    scope: Optional[InstitutionExcelScope],
) -> bool:
    """True when the row belongs to the scoped institution (or scope is unset)."""
    if scope is None or not scope.is_active:
        return True

    inst = _norm(row.get("institution"))
    if inst and inst in scope.excel_names:
        return True

    # Partial name containment (e.g. "Rongo" vs "Rongo University")
    if inst and scope.excel_names:
        for name in scope.excel_names:
            if name and (name in inst or inst in name):
                return True

    domain = _email_domain(row.get("email"))
    if domain and domain in scope.domains:
        return True

    return False


def filter_rows_for_institution(
    rows: Iterable[dict],
    scope: Optional[InstitutionExcelScope],
) -> list[dict]:
    if scope is None or not scope.is_active:
        return list(rows)
    return [r for r in rows if row_matches_institution_scope(r, scope)]


def scope_from_domains(
    domains: Iterable[str],
    *,
    institution_id: int = 0,
    name: Optional[str] = None,
) -> InstitutionExcelScope:
    """Build a scope from raw domains (e.g. signup / email validation)."""
    domain_set = frozenset(_norm(d) for d in domains if d)
    excel_names: set[str] = set()
    for domain in domain_set:
        mapped = DOMAIN_TO_EXCEL_INSTITUTION.get(domain)
        if mapped:
            excel_names.add(_norm(mapped))
    if name:
        canonical = _canonical_excel_name(name)
        if canonical:
            excel_names.add(_norm(canonical))
        excel_names.add(_norm(name))
    return InstitutionExcelScope(
        institution_id=institution_id,
        name=name,
        domains=domain_set,
        excel_names=frozenset(excel_names),
    )
