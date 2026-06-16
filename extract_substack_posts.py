#!/usr/bin/env python3
"""Extract all post links from a Substack publication's public archive.

Substack exposes a public JSON archive API:

    https://<publication>.substack.com/api/v1/archive?sort=new&limit=50&offset=N

This script pages through that API and writes every post's title and URL to a
file you can drop into NotebookLM as a source.

Usage:
    # Default: post.substack.com -> Markdown (title + URL)
    python3 extract_substack_posts.py

    # Pick a different publication and/or output format
    python3 extract_substack_posts.py --host example.substack.com --format md
    python3 extract_substack_posts.py --host example.substack.com --format txt
    python3 extract_substack_posts.py --host example.substack.com --format csv
    python3 extract_substack_posts.py -o my_sources.md

Notes:
    - Pure standard library, no pip installs needed.
    - Only public/free posts expose a usable canonical_url; paywalled posts are
      still listed by title.
"""

import argparse
import csv
import json
import sys
import time
import urllib.error
import urllib.request

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)


def fetch_page(host: str, limit: int, offset: int):
    """Fetch one page of the archive API and return the decoded JSON list."""
    url = (
        f"https://{host}/api/v1/archive"
        f"?sort=new&limit={limit}&offset={offset}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_all_posts(host: str, limit: int = 50, delay: float = 0.5):
    """Page through the whole archive, returning a list of post dicts."""
    posts = []
    offset = 0
    while True:
        try:
            page = fetch_page(host, limit, offset)
        except urllib.error.HTTPError as exc:
            print(f"HTTP error at offset {offset}: {exc}", file=sys.stderr)
            break
        except urllib.error.URLError as exc:
            print(f"Network error at offset {offset}: {exc}", file=sys.stderr)
            break

        if not page:
            break

        posts.extend(page)
        print(f"  fetched {len(posts)} posts so far...", file=sys.stderr)
        offset += limit
        time.sleep(delay)  # be polite to the API

    return posts


def normalize(posts):
    """Reduce raw API objects to (title, url, date), de-duplicated by url."""
    seen = set()
    rows = []
    for p in posts:
        url = p.get("canonical_url") or ""
        title = (p.get("title") or "(untitled)").strip()
        date = (p.get("post_date") or "")[:10]
        key = url or title
        if key in seen:
            continue
        seen.add(key)
        rows.append((title, url, date))
    return rows


def write_output(rows, fmt: str, out_path: str):
    if fmt == "txt":
        with open(out_path, "w", encoding="utf-8") as f:
            for _title, url, _date in rows:
                if url:
                    f.write(url + "\n")
    elif fmt == "csv":
        with open(out_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["title", "url", "date"])
            writer.writerows(rows)
    else:  # md
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(f"# Substack posts ({len(rows)})\n\n")
            for title, url, date in rows:
                if url:
                    f.write(f"- [{title}]({url}){f' — {date}' if date else ''}\n")
                else:
                    f.write(f"- {title}{f' — {date}' if date else ''}\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--host", default="post.substack.com",
                        help="Publication host (default: post.substack.com)")
    parser.add_argument("--format", choices=["md", "txt", "csv"], default="md",
                        help="Output format (default: md)")
    parser.add_argument("-o", "--output", default=None,
                        help="Output file path (default: substack_posts.<ext>)")
    parser.add_argument("--limit", type=int, default=50,
                        help="Page size for the API (default: 50)")
    args = parser.parse_args()

    out_path = args.output or f"substack_posts.{args.format}"

    print(f"Fetching posts from {args.host} ...", file=sys.stderr)
    posts = fetch_all_posts(args.host, limit=args.limit)
    rows = normalize(posts)

    if not rows:
        print("No posts found. The host may be wrong, private, or blocking "
              "requests.", file=sys.stderr)
        sys.exit(1)

    write_output(rows, args.format, out_path)
    print(f"Wrote {len(rows)} posts to {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
