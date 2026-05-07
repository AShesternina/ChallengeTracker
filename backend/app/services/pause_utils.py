"""Helpers for working with challenge pause periods."""
import json
from datetime import date, timedelta
from typing import Optional


def _parse_pause_periods(json_str: Optional[str]) -> list[dict]:
    if not json_str:
        return []
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return []


def is_paused_on(pause_periods_json: Optional[str], target_date: date) -> bool:
    """Return True if the challenge was paused on target_date."""
    date_str = str(target_date)
    for p in _parse_pause_periods(pause_periods_json):
        start = p.get("start")
        end = p.get("end")
        if start and date_str >= start and (end is None or date_str <= end):
            return True
    return False


def get_paused_dates(pause_periods_json: Optional[str]) -> set[date]:
    """Return all dates where the challenge was paused."""
    paused: set[date] = set()
    today = date.today()
    for p in _parse_pause_periods(pause_periods_json):
        if not p.get("start"):
            continue
        start = date.fromisoformat(p["start"])
        end = date.fromisoformat(p["end"]) if p.get("end") else today
        d = start
        while d <= end:
            paused.add(d)
            d += timedelta(days=1)
    return paused
