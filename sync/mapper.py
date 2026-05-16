"""Map a Google Calendar event dict to an iCalendar VEVENT."""

from __future__ import annotations

import datetime as dt
from typing import Optional

from icalendar import Calendar, Event, vDatetime, vText
from icalendar import vDate


UID_SUFFIX = "@gcal-icloud-sync"


def _parse_gcal_datetime(value: dict) -> tuple[Optional[dt.datetime | dt.date], bool]:
    """Return (datetime|date, is_all_day). value is a Google event's start/end struct."""
    if "dateTime" in value:
        # RFC3339: e.g. 2025-05-20T10:00:00+09:00
        return dt.datetime.fromisoformat(value["dateTime"].replace("Z", "+00:00")), False
    if "date" in value:
        return dt.date.fromisoformat(value["date"]), True
    return None, False


def to_vevent_ical(gcal_event: dict) -> bytes:
    """Convert a Google event into a serialized iCalendar (VCALENDAR) byte string."""
    cal = Calendar()
    cal.add("prodid", "-//gcal-icloud-sync//EN")
    cal.add("version", "2.0")

    ev = Event()
    ev.add("uid", f"{gcal_event['id']}{UID_SUFFIX}")

    summary = gcal_event.get("summary") or "(No title)"
    ev.add("summary", vText(summary))

    if gcal_event.get("description"):
        ev.add("description", vText(gcal_event["description"]))
    if gcal_event.get("location"):
        ev.add("location", vText(gcal_event["location"]))

    start_val, start_all_day = _parse_gcal_datetime(gcal_event.get("start", {}))
    end_val, _end_all_day = _parse_gcal_datetime(gcal_event.get("end", {}))
    if start_val is not None:
        ev.add("dtstart", start_val)
    if end_val is not None:
        ev.add("dtend", end_val)

    # Recurrence — pass RRULE/EXDATE/RDATE lines through as-is
    for line in gcal_event.get("recurrence", []) or []:
        if ":" not in line:
            continue
        prop, value = line.split(":", 1)
        prop = prop.upper()
        if prop == "RRULE":
            rules = {}
            for part in value.split(";"):
                if "=" in part:
                    k, v = part.split("=", 1)
                    rules[k] = v
            ev.add("rrule", rules)
        elif prop in ("EXDATE", "RDATE"):
            # Keep raw value via vText fallback
            ev.add(prop.lower(), vText(value))

    created = gcal_event.get("created")
    if created:
        ev.add("created", dt.datetime.fromisoformat(created.replace("Z", "+00:00")))
    updated = gcal_event.get("updated")
    if updated:
        ev.add("last-modified", dt.datetime.fromisoformat(updated.replace("Z", "+00:00")))

    cal.add_component(ev)
    return cal.to_ical()


def event_uid(gcal_event_id: str) -> str:
    return f"{gcal_event_id}{UID_SUFFIX}"
