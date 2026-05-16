"""Sync state persistence.

State maps Google Calendar event IDs to their iCloud CalDAV counterparts so
subsequent runs can decide between create / update / delete.
"""

from __future__ import annotations

import json
import os
import tempfile
from dataclasses import asdict, dataclass
from typing import Dict, Optional


@dataclass
class EventLink:
    icloud_href: str
    etag: Optional[str]
    gcal_updated: str
    gcal_calendar_id: str


class SyncState:
    def __init__(self, path: str):
        self.path = path
        self._links: Dict[str, EventLink] = {}

    @classmethod
    def load(cls, path: str) -> "SyncState":
        state = cls(path)
        if not os.path.exists(path):
            return state
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        for gid, link in raw.get("links", {}).items():
            state._links[gid] = EventLink(**link)
        return state

    def save(self) -> None:
        payload = {"links": {gid: asdict(link) for gid, link in self._links.items()}}
        os.makedirs(os.path.dirname(os.path.abspath(self.path)) or ".", exist_ok=True)
        fd, tmp_path = tempfile.mkstemp(
            prefix=".state-", suffix=".json", dir=os.path.dirname(os.path.abspath(self.path)) or "."
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
            os.replace(tmp_path, self.path)
        except Exception:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            raise

    def get(self, google_event_id: str) -> Optional[EventLink]:
        return self._links.get(google_event_id)

    def set(self, google_event_id: str, link: EventLink) -> None:
        self._links[google_event_id] = link

    def remove(self, google_event_id: str) -> None:
        self._links.pop(google_event_id, None)

    def all_ids(self) -> list[str]:
        return list(self._links.keys())
