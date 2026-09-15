import logging
import time

from fastapi import APIRouter, HTTPException, Request, status

from app.email import send_demo_request_email
from app.schemas import DemoRequestCreate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/demo", tags=["Demo"])

_RATE_LIMIT_SECONDS = 60
_last_request_at: dict[str, float] = {}


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _too_soon(ip: str) -> bool:
    now = time.time()
    last = _last_request_at.get(ip, 0)
    if now - last < _RATE_LIMIT_SECONDS:
        return True
    _last_request_at[ip] = now
    return False


@router.post("/request")
async def create_demo_request(payload: DemoRequestCreate, request: Request):
    if _too_soon(_client_ip(request)):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait a moment before sending another request.",
        )

    if payload.website:
        return {"ok": True}

    sent = send_demo_request_email(
        full_name=payload.full_name,
        email=str(payload.email),
        institution=payload.institution,
        job_title=payload.job_title,
        phone=payload.phone,
        message=payload.message,
    )
    if not sent:
        logger.error("Failed to send demo request email from %s", payload.email)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send the demo request right now.",
        )
    return {"ok": True}
