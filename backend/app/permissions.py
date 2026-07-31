"""Role checks for staff and financial aid workflows."""

from fastapi import HTTPException, status

from app.account_category import STAFF_ROLES
from app.models import User, UserRole

# Financial Aid Officer — creates/configures scholarship opportunities
FINANCIAL_AID_OFFICER_ROLES = frozenset({UserRole.SCHOLARSHIP_OFFICE, UserRole.GLOBAL_ADMIN})

# Director / checker — publishes programmes (maker-checker, different from creator)
SCHOLARSHIP_PUBLISHER_ROLES = frozenset({
    UserRole.REGISTRAR,
    UserRole.INSTITUTION_ADMIN,
    UserRole.VICE_CHANCELLOR,
    UserRole.GLOBAL_ADMIN,
})

# Committee blind-review portal (Stage 4)
SCHOLARSHIP_COMMITTEE_ROLES = frozenset({
    UserRole.REGISTRAR,
    UserRole.INSTITUTION_ADMIN,
    UserRole.VICE_CHANCELLOR,
    UserRole.GLOBAL_ADMIN,
    UserRole.SCHOLARSHIP_REVIEWER,
})

REVIEWER_PORTAL_ROLES = frozenset({UserRole.SCHOLARSHIP_REVIEWER})

STAFF_PORTAL_ROLES = STAFF_ROLES | {UserRole.GLOBAL_ADMIN}


def _as_role(role) -> UserRole:
    return role if isinstance(role, UserRole) else UserRole(str(role))


def assert_roles(user: User, allowed: frozenset, message: str = "Insufficient permissions") -> None:
    if _as_role(user.role) not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)


def assert_staff_portal(user: User) -> None:
    assert_roles(user, STAFF_PORTAL_ROLES, "Staff access required")


GRANT_APPLICATION_VIEW_ROLES = STAFF_PORTAL_ROLES | SCHOLARSHIP_PUBLISHER_ROLES


def assert_grant_application_view(user: User) -> None:
    assert_roles(
        user,
        GRANT_APPLICATION_VIEW_ROLES,
        "Staff or institution admin access required to view grant applications",
    )


def assert_reviewer_portal(user: User) -> None:
    assert_roles(user, REVIEWER_PORTAL_ROLES, "Reviewer access required")


ADVISOR_PORTAL_ROLES = frozenset({UserRole.RESEARCH_OFFICE})


def is_advisor_portal_user(user: User) -> bool:
    role = _as_role(user.role)
    return user.account_category in ("advisor", "sponsor") or role in ADVISOR_PORTAL_ROLES


def is_sponsor_portal_user(user: User) -> bool:
    return is_advisor_portal_user(user)


def assert_committee_or_reviewer(user: User) -> None:
    assert_roles(
        user,
        SCHOLARSHIP_COMMITTEE_ROLES,
        "Committee or reviewer access required",
    )


def assert_financial_aid_officer(user: User) -> None:
    assert_roles(
        user,
        FINANCIAL_AID_OFFICER_ROLES,
        "Financial Aid Officer role required to configure scholarship opportunities",
    )


def assert_scholarship_publisher(user: User) -> None:
    assert_roles(
        user,
        SCHOLARSHIP_PUBLISHER_ROLES,
        "Director-level role required to publish scholarship opportunities",
    )


def is_financial_aid_officer(user: User) -> bool:
    return _as_role(user.role) in FINANCIAL_AID_OFFICER_ROLES
