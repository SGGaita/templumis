"""Derive and persist account_category when missing on legacy users."""



from sqlalchemy.orm import Session



from app.models import User, UserRole



STAFF_ROLES = {

    UserRole.VICE_CHANCELLOR,

    UserRole.REGISTRAR,

    UserRole.SCHOLARSHIP_OFFICE,

    UserRole.STUDENT_SERVICES,

    UserRole.RESEARCH_OFFICE,

}



SPONSOR_CATEGORIES = frozenset({"advisor", "sponsor"})





def resolve_account_category(user: User) -> str | None:

    if user.account_category in (

        "staff", "student", "institution_admin", "global_admin", "reviewer", "advisor", "sponsor"

    ):

        return user.account_category

    if user.role == UserRole.SCHOLARSHIP_REVIEWER:

        return "reviewer"

    if user.role == UserRole.STUDENT:

        return "student"

    if user.role in STAFF_ROLES:

        return "staff"

    if user.role == UserRole.INSTITUTION_ADMIN:

        return "institution_admin"

    if user.role == UserRole.GLOBAL_ADMIN:

        return "global_admin"

    return user.account_category





def sync_account_category(user: User, db: Session) -> str | None:

    # Never downgrade explicit sponsor/advisor accounts to staff on login.

    if user.account_category in SPONSOR_CATEGORIES:

        return user.account_category

    resolved = resolve_account_category(user)

    if resolved and user.account_category != resolved:

        user.account_category = resolved

        db.commit()

        db.refresh(user)

    return user.account_category or resolved

