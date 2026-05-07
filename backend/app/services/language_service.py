"""Detect user language from IP geolocation or Accept-Language header."""
import httpx
from fastapi import Request

SUPPORTED_LANGUAGES = {"en", "es", "pt", "ru"}

_COUNTRY_LANGUAGE: dict[str, str] = {
    # Russian-speaking countries
    "RU": "ru", "BY": "ru", "KZ": "ru", "KG": "ru",
    "TJ": "ru", "TM": "ru", "UZ": "ru", "AM": "ru",
    "AZ": "ru", "GE": "ru", "MD": "ru",
    # Spanish-speaking countries
    "ES": "es", "MX": "es", "AR": "es", "CO": "es",
    "CL": "es", "PE": "es", "VE": "es", "EC": "es",
    "BO": "es", "PY": "es", "UY": "es", "DO": "es",
    "GT": "es", "HN": "es", "SV": "es", "NI": "es",
    "CR": "es", "PA": "es", "CU": "es", "PR": "es", "GQ": "es",
    # Portuguese-speaking countries
    "BR": "pt", "PT": "pt", "AO": "pt", "MZ": "pt",
    "CV": "pt", "GW": "pt", "ST": "pt", "TL": "pt",
}


def _get_client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


async def _lang_from_ip(ip: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            r = await client.get(f"https://ipapi.co/{ip}/country/")
            if r.status_code == 200:
                country = r.text.strip().upper()
                return _COUNTRY_LANGUAGE.get(country)
    except Exception:
        pass
    return None


def _lang_from_accept_header(header: str | None) -> str:
    if not header:
        return "en"
    first = header.split(",")[0].split(";")[0].strip().lower()
    code = first[:2]
    return code if code in SUPPORTED_LANGUAGES else "en"


async def detect_language(request: Request) -> str:
    ip = _get_client_ip(request)
    if ip and ip not in ("127.0.0.1", "::1", "testclient"):
        lang = await _lang_from_ip(ip)
        if lang:
            return lang
    return _lang_from_accept_header(request.headers.get("accept-language"))
