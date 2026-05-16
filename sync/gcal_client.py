"""Google Calendar client (OAuth2 + events list)."""

from __future__ import annotations

import datetime as dt
import os
from typing import Iterable, Iterator, List

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]


def authorize(client_secret_file: str, token_file: str) -> Credentials:
    creds: Credentials | None = None
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)
    if creds and creds.valid:
        return creds
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file(client_secret_file, SCOPES)
        creds = flow.run_local_server(port=0)
    os.makedirs(os.path.dirname(os.path.abspath(token_file)) or ".", exist_ok=True)
    with open(token_file, "w", encoding="utf-8") as f:
        f.write(creds.to_json())
    return creds


class GoogleCalendarClient:
    def __init__(self, creds: Credentials):
        self.service = build("calendar", "v3", credentials=creds, cache_discovery=False)

    def fetch_future_events(self, calendar_id: str, days_ahead: int) -> List[dict]:
        """Return all events from now to now+days_ahead, including cancelled.

        Uses singleEvents=False so RRULE-based recurring series are returned as
        a single master event (preserves original recurrence definition).
        """
        now = dt.datetime.now(dt.timezone.utc)
        time_min = now.isoformat()
        time_max = (now + dt.timedelta(days=days_ahead)).isoformat()

        events: List[dict] = []
        page_token: str | None = None
        while True:
            resp = (
                self.service.events()
                .list(
                    calendarId=calendar_id,
                    timeMin=time_min,
                    timeMax=time_max,
                    singleEvents=False,
                    showDeleted=True,
                    maxResults=2500,
                    pageToken=page_token,
                )
                .execute()
            )
            events.extend(resp.get("items", []))
            page_token = resp.get("nextPageToken")
            if not page_token:
                break
        return events
