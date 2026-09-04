"""Live Webometrics Visibility helpers (domain reachability + optional Ahrefs API)."""

from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Total referring-domain count (live_refdomains) — preferred for Webometrics Impact
AHREFS_BACKLINKS_STATS_URL = "https://api.ahrefs.com/v3/site-explorer/backlinks-stats"
# Paginated list fallback if stats are unavailable
AHREFS_REFDOMAINS_URL = "https://api.ahrefs.com/v3/site-explorer/refdomains"


def normalize_domain(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    domain = str(value).strip().lower()
    domain = domain.replace("https://", "").replace("http://", "")
    domain = domain.split("/")[0].lstrip("@")
    return domain or None


def resolve_canonical_domain(domains: list[str], primary_domain: Optional[str] = None) -> Optional[str]:
    cleaned = [normalize_domain(d) for d in domains or []]
    cleaned = [d for d in cleaned if d]
    primary = normalize_domain(primary_domain)
    if primary and primary in cleaned:
        return primary
    if primary:
        return primary
    return cleaned[0] if cleaned else None


def _ahrefs_report_date() -> str:
    """Ahrefs often lags a day or two; use yesterday UTC-ish to avoid empty snapshots."""
    return (date.today() - timedelta(days=1)).isoformat()


async def probe_website(domain: str) -> dict[str, Any]:
    """Live check whether https://{domain} responds."""
    url = f"https://{domain}"
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=8.0) as client:
            response = await client.head(url)
            if response.status_code >= 400:
                response = await client.get(url)
            return {
                "reachable": response.status_code < 400,
                "status_code": response.status_code,
                "final_url": str(response.url),
                "checked_url": url,
            }
    except Exception as exc:
        logger.info("Website probe failed for %s: %s", domain, exc)
        return {
            "reachable": False,
            "status_code": None,
            "final_url": None,
            "checked_url": url,
            "error": str(exc),
        }


async def fetch_ahrefs_referring_domains(domain: str) -> dict[str, Any]:
    """
    Live Ahrefs referring-domain count when AHREFS_API_TOKEN is configured.
    Uses Site Explorer backlinks-stats (live_refdomains), then refdomains list as fallback.
    """
    token = (settings.ahrefs_api_token or "").strip()
    if not token:
        return {
            "configured": False,
            "status": "provider_not_configured",
            "referring_domains": None,
            "message": (
                "AHREFS_API_TOKEN is not set. Add an Ahrefs API v3 token to enable "
                "live referring-domain counts for Webometrics Visibility."
            ),
        }

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    report_date = _ahrefs_report_date()
    base_params = {
        "target": domain,
        "mode": "subdomains",
        "protocol": "both",
        "date": report_date,
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            stats_res = await client.get(
                AHREFS_BACKLINKS_STATS_URL,
                headers=headers,
                params=base_params,
            )
            if stats_res.status_code == 200:
                payload = stats_res.json()
                metrics = payload.get("metrics") or payload.get("data") or payload
                if isinstance(metrics, dict):
                    ref = metrics.get("live_refdomains")
                    if ref is None:
                        ref = metrics.get("all_time_refdomains")
                    if ref is not None:
                        return {
                            "configured": True,
                            "status": "ok",
                            "provider": "ahrefs",
                            "endpoint": "site-explorer/backlinks-stats",
                            "report_date": report_date,
                            "referring_domains": int(ref),
                            "live_backlinks": metrics.get("live"),
                            "all_time_refdomains": metrics.get("all_time_refdomains"),
                            "raw": metrics,
                        }

            ref_params = {
                **base_params,
                "select": "domain,domain_rating",
                "limit": 1000,
                "order_by": "domain_rating:desc",
            }
            ref_res = await client.get(AHREFS_REFDOMAINS_URL, headers=headers, params=ref_params)
            if ref_res.status_code == 200:
                payload = ref_res.json()
                rows = payload.get("refdomains") or payload.get("data") or []
                total = payload.get("total") or payload.get("count")
                if total is None and isinstance(rows, list):
                    total = len(rows)
                return {
                    "configured": True,
                    "status": "ok",
                    "provider": "ahrefs",
                    "endpoint": "site-explorer/refdomains",
                    "report_date": report_date,
                    "referring_domains": int(total or 0),
                    "sample_size": len(rows) if isinstance(rows, list) else None,
                    "note": "Count derived from refdomains list/total; prefer backlinks-stats when available.",
                }

            detail = None
            try:
                detail = stats_res.json() if stats_res.status_code != 200 else ref_res.json()
            except Exception:
                detail = {
                    "stats_status": stats_res.status_code,
                    "refdomains_status": ref_res.status_code,
                }

            return {
                "configured": True,
                "status": "provider_error",
                "referring_domains": None,
                "report_date": report_date,
                "http_status": (
                    ref_res.status_code if ref_res.status_code != 200 else stats_res.status_code
                ),
                "message": "Ahrefs API request failed. Check token permissions and Site Explorer access.",
                "detail": detail,
            }
    except Exception as exc:
        logger.exception("Ahrefs referring-domain lookup failed for %s", domain)
        return {
            "configured": True,
            "status": "provider_error",
            "referring_domains": None,
            "message": f"Ahrefs request error: {exc}",
        }


def score_visibility(
    *,
    has_domain: bool,
    website_reachable: bool,
    referring_domains: Optional[int],
) -> dict[str, Any]:
    """Map live evidence to a readiness score for the Visibility / Impact indicator."""
    if not has_domain:
        return {"score": 0, "status": "No data", "band": "missing_domain"}

    if referring_domains is None:
        if website_reachable:
            return {"score": 22, "status": "Limited", "band": "domain_live_no_ahrefs"}
        return {"score": 15, "status": "Limited", "band": "domain_only"}

    count = max(0, int(referring_domains))
    if count <= 0:
        base = 25 if website_reachable else 18
        return {"score": base, "status": "Limited", "band": "zero_refdomains"}
    if count < 10:
        return {"score": 40, "status": "Limited", "band": "low_refdomains"}
    if count < 50:
        return {"score": 55, "status": "Good", "band": "moderate_refdomains"}
    if count < 200:
        return {"score": 70, "status": "Good", "band": "strong_refdomains"}
    return {"score": 85, "status": "Excellent", "band": "high_refdomains"}


async def assess_webometrics_visibility(
    *,
    domains: list[str],
    primary_domain: Optional[str] = None,
) -> dict[str, Any]:
    canonical = resolve_canonical_domain(domains, primary_domain)
    unique_domains = sorted({normalize_domain(d) for d in domains or [] if normalize_domain(d)})

    if not canonical:
        scoring = score_visibility(
            has_domain=False,
            website_reachable=False,
            referring_domains=None,
        )
        return {
            "canonical_domain": None,
            "registered_domains": unique_domains,
            "website": None,
            "ahrefs": {
                "configured": bool((settings.ahrefs_api_token or "").strip()),
                "status": "skipped",
                "referring_domains": None,
                "message": "No verified institutional domain registered.",
            },
            "scoring": scoring,
            "live": True,
        }

    website = await probe_website(canonical)
    ahrefs = await fetch_ahrefs_referring_domains(canonical)
    scoring = score_visibility(
        has_domain=True,
        website_reachable=bool(website.get("reachable")),
        referring_domains=ahrefs.get("referring_domains"),
    )

    return {
        "canonical_domain": canonical,
        "registered_domains": unique_domains,
        "website": website,
        "ahrefs": ahrefs,
        "scoring": scoring,
        "live": True,
        "checked_target": f"https://{canonical}",
    }
