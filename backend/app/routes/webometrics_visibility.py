"""Webometrics Visibility live assessment endpoint."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import User, InstitutionDomain
from app.services.ahrefs_visibility import assess_webometrics_visibility

router = APIRouter(prefix="/api/rankings", tags=["Rankings"])


def _require_staff(current_user: User):
    if current_user.account_category != "staff":
        raise HTTPException(status_code=403, detail="Only staff can access rankings")
    if not current_user.institution_id:
        raise HTTPException(status_code=400, detail="No institution linked to this account")


@router.get("/webometrics/visibility")
async def get_webometrics_visibility(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Live Visibility / Impact assessment for the current institution.

    - Uses verified institution domains from TemplumIS
    - Probes https://{canonical-domain} reachability
    - When AHREFS_API_TOKEN is set, fetches live Ahrefs referring-domain count
    """
    _require_staff(current_user)

    rows = (
        db.query(InstitutionDomain)
        .filter(InstitutionDomain.institution_id == current_user.institution_id)
        .all()
    )
    domains = [r.domain for r in rows]
    primary = next((r.domain for r in rows if r.is_primary), None)

    assessment = await assess_webometrics_visibility(
        domains=domains,
        primary_domain=primary,
    )
    assessment["institution_id"] = current_user.institution_id
    return assessment
