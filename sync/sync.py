"""Google Calendar → iCloud one-way sync (future events only).

Usage:
    python sync/sync.py --auth        # one-time Google OAuth setup
    python sync/sync.py --dry-run     # print actions without writing to iCloud
    python sync/sync.py               # full sync

Configuration:
    sync/config.yaml      (copy from config.example.yaml)
    sync/.env             (copy from .env.example)
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import yaml
from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from gcal_client import GoogleCalendarClient, authorize  # noqa: E402
from icloud_client import ICloudCalendarClient  # noqa: E402
from mapper import to_vevent_ical  # noqa: E402
from state import EventLink, SyncState  # noqa: E402


@dataclass
class Stats:
    created: int = 0
    updated: int = 0
    deleted: int = 0
    skipped: int = 0
    errors: int = 0

    def summary(self) -> str:
        return (
            f"created={self.created} updated={self.updated} "
            f"deleted={self.deleted} skipped={self.skipped} errors={self.errors}"
        )


def load_config(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(
            f"Config file not found: {path}. Copy config.example.yaml to config.yaml."
        )
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def setup_logging(log_file: str) -> logging.Logger:
    logger = logging.getLogger("gcal-icloud-sync")
    logger.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s")

    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(fmt)
    logger.addHandler(sh)

    log_path = Path(log_file)
    if not log_path.is_absolute():
        log_path = HERE / log_path
    log_path.parent.mkdir(parents=True, exist_ok=True)
    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setFormatter(fmt)
    logger.addHandler(fh)
    return logger


def sync_calendar(
    gcal: GoogleCalendarClient,
    icloud: Optional[ICloudCalendarClient],
    state: SyncState,
    calendar_id: str,
    days_ahead: int,
    request_interval_sec: float,
    dry_run: bool,
    logger: logging.Logger,
) -> Stats:
    stats = Stats()
    logger.info("Fetching events from Google calendar %s (next %d days)", calendar_id, days_ahead)
    events = gcal.fetch_future_events(calendar_id, days_ahead)
    logger.info("Got %d events from Google", len(events))

    seen_ids: set[str] = set()

    for ev in events:
        gid = ev.get("id")
        if not gid:
            continue
        seen_ids.add(gid)
        status = ev.get("status")
        link = state.get(gid)

        if status == "cancelled":
            if link is not None:
                logger.info("DELETE (cancelled) %s", gid)
                if not dry_run and icloud is not None:
                    try:
                        icloud.delete(link.icloud_href)
                        state.remove(gid)
                    except Exception as e:
                        logger.exception("Failed to delete %s: %s", gid, e)
                        stats.errors += 1
                        continue
                    time.sleep(request_interval_sec)
                stats.deleted += 1
            else:
                stats.skipped += 1
            continue

        ical_bytes = to_vevent_ical(ev)

        if link is None:
            logger.info("CREATE %s (%s)", gid, ev.get("summary"))
            if not dry_run and icloud is not None:
                try:
                    href, etag = icloud.create(ical_bytes)
                    state.set(
                        gid,
                        EventLink(
                            icloud_href=href,
                            etag=etag,
                            gcal_updated=ev.get("updated", ""),
                            gcal_calendar_id=calendar_id,
                        ),
                    )
                except Exception as e:
                    logger.exception("Failed to create %s: %s", gid, e)
                    stats.errors += 1
                    continue
                time.sleep(request_interval_sec)
            stats.created += 1
        elif ev.get("updated", "") > link.gcal_updated:
            logger.info("UPDATE %s (%s)", gid, ev.get("summary"))
            if not dry_run and icloud is not None:
                try:
                    href, etag = icloud.update(link.icloud_href, ical_bytes)
                    state.set(
                        gid,
                        EventLink(
                            icloud_href=href,
                            etag=etag,
                            gcal_updated=ev.get("updated", ""),
                            gcal_calendar_id=calendar_id,
                        ),
                    )
                except Exception as e:
                    logger.exception("Failed to update %s: %s", gid, e)
                    stats.errors += 1
                    continue
                time.sleep(request_interval_sec)
            stats.updated += 1
        else:
            stats.skipped += 1

    # Delete events that were in state for this calendar but no longer returned
    for gid in list(state.all_ids()):
        link = state.get(gid)
        if link is None or link.gcal_calendar_id != calendar_id:
            continue
        if gid in seen_ids:
            continue
        logger.info("DELETE (vanished) %s", gid)
        if not dry_run and icloud is not None:
            try:
                icloud.delete(link.icloud_href)
                state.remove(gid)
            except Exception as e:
                logger.exception("Failed to delete vanished %s: %s", gid, e)
                stats.errors += 1
                continue
            time.sleep(request_interval_sec)
        stats.deleted += 1

    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync Google Calendar → iCloud")
    parser.add_argument("--auth", action="store_true", help="Run Google OAuth flow and exit")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without writing")
    parser.add_argument(
        "--config",
        default=str(HERE / "config.yaml"),
        help="Path to config.yaml (default: sync/config.yaml)",
    )
    parser.add_argument(
        "--env-file",
        default=str(HERE / ".env"),
        help="Path to .env file (default: sync/.env)",
    )
    args = parser.parse_args()

    load_dotenv(args.env_file)
    cfg = load_config(Path(args.config))
    logger = setup_logging(cfg["sync"].get("log_file", "sync.log"))

    client_secret_file = os.environ.get("GOOGLE_CLIENT_SECRET_FILE", "credentials/client_secret.json")
    token_file = os.environ.get("GOOGLE_TOKEN_FILE", "credentials/token.json")
    if not os.path.isabs(client_secret_file):
        client_secret_file = str(HERE / client_secret_file)
    if not os.path.isabs(token_file):
        token_file = str(HERE / token_file)

    creds = authorize(client_secret_file, token_file)
    if args.auth:
        logger.info("Google OAuth complete. Token saved to %s", token_file)
        return 0

    gcal = GoogleCalendarClient(creds)

    icloud: Optional[ICloudCalendarClient] = None
    if not args.dry_run:
        apple_id = os.environ.get("APPLE_ID")
        app_pw = os.environ.get("APPLE_APP_PASSWORD")
        if not apple_id or not app_pw:
            logger.error("APPLE_ID / APPLE_APP_PASSWORD must be set in .env")
            return 2
        icloud = ICloudCalendarClient(
            apple_id=apple_id,
            app_password=app_pw,
            calendar_name=cfg["icloud"]["calendar_name"],
        )

    state_path = cfg["sync"].get("state_file", "state.json")
    if not os.path.isabs(state_path):
        state_path = str(HERE / state_path)
    state = SyncState.load(state_path)

    total = Stats()
    try:
        for cal_id in cfg["google"]["calendar_ids"]:
            s = sync_calendar(
                gcal=gcal,
                icloud=icloud,
                state=state,
                calendar_id=cal_id,
                days_ahead=int(cfg["google"].get("days_ahead", 60)),
                request_interval_sec=float(cfg["sync"].get("request_interval_sec", 0.2)),
                dry_run=args.dry_run,
                logger=logger,
            )
            total.created += s.created
            total.updated += s.updated
            total.deleted += s.deleted
            total.skipped += s.skipped
            total.errors += s.errors
    finally:
        if not args.dry_run:
            state.save()

    logger.info("Sync done: %s%s", total.summary(), " (dry-run)" if args.dry_run else "")
    return 0 if total.errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
