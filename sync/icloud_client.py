"""Minimal CalDAV wrapper for iCloud."""

from __future__ import annotations

from typing import Optional

import caldav
from caldav.lib.error import NotFoundError

ICLOUD_URL = "https://caldav.icloud.com"


class ICloudCalendarClient:
    def __init__(self, apple_id: str, app_password: str, calendar_name: str):
        self._client = caldav.DAVClient(
            url=ICLOUD_URL, username=apple_id, password=app_password
        )
        principal = self._client.principal()
        calendar = None
        for cal in principal.calendars():
            if (cal.name or "").strip() == calendar_name.strip():
                calendar = cal
                break
        if calendar is None:
            available = ", ".join(c.name or "?" for c in principal.calendars())
            raise RuntimeError(
                f"iCloud calendar named '{calendar_name}' not found. "
                f"Available: {available}. "
                "Create the calendar manually in the iCloud Calendar app first."
            )
        self.calendar = calendar

    def create(self, ical_bytes: bytes) -> tuple[str, Optional[str]]:
        event = self.calendar.save_event(ical_bytes.decode("utf-8"))
        href = event.url.path if hasattr(event.url, "path") else str(event.url)
        etag = getattr(event, "etag", None)
        return href, etag

    def update(self, href: str, ical_bytes: bytes) -> tuple[str, Optional[str]]:
        # Fetch existing by href, replace data, save
        url = self._absolute_url(href)
        event = self.calendar.event_by_url(url)
        event.data = ical_bytes.decode("utf-8")
        event.save()
        return href, getattr(event, "etag", None)

    def delete(self, href: str) -> None:
        url = self._absolute_url(href)
        try:
            event = self.calendar.event_by_url(url)
            event.delete()
        except NotFoundError:
            # Already gone — treat as success
            return

    def _absolute_url(self, href: str) -> str:
        if href.startswith("http://") or href.startswith("https://"):
            return href
        return ICLOUD_URL.rstrip("/") + "/" + href.lstrip("/")
