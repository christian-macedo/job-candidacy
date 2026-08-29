#!/usr/bin/env python3
"""Turn a LinkedIn data-export archive into a readable markdown digest.

Reads a "Get a copy of your data" .zip (or an already-extracted directory) and
writes a single markdown file containing only the career-relevant records.

Files holding other people's personal data -- Connections.csv, messages.csv,
Invitations.csv, ad targeting -- are never read. Endorsements are reduced to
per-skill counts so endorsers' names stay out of the digest.

Usage:
    python3 linkedin_export.py <export.zip|export_dir> [-o digest.md]
"""

import argparse
import csv
import io
import re
import sys
import zipfile
from pathlib import Path

# Files we read, in the order they appear in the digest. Anything not listed
# here is ignored -- an allowlist, so a new LinkedIn export format can only
# ever give us less, never leak more.
WANTED = [
    "Profile.csv",
    "Profile Summary.csv",
    "Email Addresses.csv",
    "PhoneNumbers.csv",
    "Positions.csv",
    "Education.csv",
    "Skills.csv",
    "Certifications.csv",
    "Courses.csv",
    "Languages.csv",
    "Publications.csv",
    "Projects.csv",
    "Honors.csv",
    "Patents.csv",
    "Recommendations_Received.csv",
    "Endorsement_Received_Info.csv",
    "Learning.csv",
    "Rich_Media.csv",
]

# Never read, even if present.
BLOCKED = {
    "connections.csv",
    "messages.csv",
    "invitations.csv",
    "ad_targeting.csv",
    "guide_messages.csv",
    "learning_coach_messages.csv",
    "endorsement_given_info.csv",
    "recommendations_given.csv",
    "whatsapp phone numbers.csv",
}

# Columns dropped on sight: internal ids, urns, tracking.
NOISE_COLS = re.compile(r"(urn|_id$|^id$|tracking|hash)", re.I)

LEARNING_LIMIT = 25


class Source:
    """Uniform reader over a zip archive or an extracted directory."""

    def __init__(self, path: Path):
        self.path = path
        self.zip = zipfile.ZipFile(path) if zipfile.is_zipfile(path) else None
        if self.zip:
            self.names = self.zip.namelist()
        elif path.is_dir():
            self.names = [str(p.relative_to(path)) for p in path.rglob("*") if p.is_file()]
        else:
            raise SystemExit(f"error: {path} is neither a zip archive nor a directory")

    def find(self, filename: str):
        """Match on basename so nested paths (Jobs/..., Articles/...) still resolve."""
        target = filename.lower()
        for name in self.names:
            if name.split("/")[-1].lower() == target:
                return name
        return None

    def read(self, name: str) -> str:
        if self.zip:
            raw = self.zip.read(name)
        else:
            raw = (self.path / name).read_bytes()
        return raw.decode("utf-8-sig", errors="replace")


def read_rows(src: Source, filename: str):
    """Return (rows, blocked_reason). Rows are dicts with noise columns removed."""
    if filename.lower() in BLOCKED:
        return [], "blocked"
    name = src.find(filename)
    if not name:
        return [], "missing"

    text = src.read(name)
    # Some exports prefix a free-text notes block before the real header.
    if text.lstrip().lower().startswith("notes:"):
        parts = text.split("\n\n", 1)
        text = parts[1] if len(parts) > 1 else text

    rows = []
    for row in csv.DictReader(io.StringIO(text)):
        clean = {
            (k or "").strip(): (v or "").strip()
            for k, v in row.items()
            if k and not NOISE_COLS.search(k) and (v or "").strip()
        }
        if clean:
            rows.append(clean)
    return rows, None


def fmt_kv(rows, keys=None):
    """Render rows as `- **Key:** value` blocks, one blank line between rows."""
    out = []
    for row in rows:
        fields = keys if keys else list(row)
        lines = [f"  - **{k}:** {row[k]}" for k in fields if row.get(k)]
        if lines:
            out.append("\n".join(lines))
    return "\n\n".join(out)


def section(title, body):
    return f"## {title}\n\n{body.rstrip()}\n" if body.strip() else ""


def build_digest(src: Source) -> str:
    parts = ["# LinkedIn export digest\n",
             f"Source: `{src.path.name}`\n"]
    skipped = []

    def grab(filename):
        rows, why = read_rows(src, filename)
        if why == "missing":
            skipped.append(f"{filename} (not in export)")
        return rows

    # --- Identity -------------------------------------------------------
    profile = grab("Profile.csv")
    if profile:
        parts.append(section("Profile", fmt_kv(profile)))

    summary = grab("Profile Summary.csv")
    if summary:
        parts.append(section("Profile summary", fmt_kv(summary)))

    contact = []
    for f, label in (("Email Addresses.csv", "Email"), ("PhoneNumbers.csv", "Phone")):
        for row in grab(f):
            contact.append(f"- **{label}:** " + " · ".join(row.values()))
    if contact:
        parts.append(section("Contact", "\n".join(contact)))

    # --- Career ---------------------------------------------------------
    positions = grab("Positions.csv")
    if positions:
        body = []
        for p in positions:
            title = p.get("Title", "(untitled)")
            company = p.get("Company Name", "")
            start, end = p.get("Started On", ""), p.get("Finished On", "Present")
            head = f"### {title} — {company}".rstrip(" —")
            meta = f"{start} – {end or 'Present'}"
            if p.get("Location"):
                meta += f" · {p['Location']}"
            block = [head, meta]
            if p.get("Description"):
                block.append("\n" + p["Description"])
            body.append("\n".join(block))
        parts.append(section("Positions", "\n\n".join(body)))

    education = grab("Education.csv")
    if education:
        parts.append(section("Education", fmt_kv(education)))

    # --- Skills ---------------------------------------------------------
    skills = grab("Skills.csv")
    if skills:
        names = [next(iter(r.values())) for r in skills]
        parts.append(section("Skills (self-listed)", "\n".join(f"- {n}" for n in names)))

    # Endorsements: counts only, so endorsers' names never enter the digest.
    endorsements = grab("Endorsement_Received_Info.csv")
    if endorsements:
        counts = {}
        for row in endorsements:
            skill = row.get("Skill Name") or row.get("Skill") or ""
            if skill:
                counts[skill] = counts.get(skill, 0) + 1
        ranked = sorted(counts.items(), key=lambda kv: -kv[1])
        parts.append(section(
            "Endorsement counts by skill",
            "\n".join(f"- {s}: {n}" for s, n in ranked)))

    for f, title in (("Certifications.csv", "Certifications"),
                     ("Courses.csv", "Courses"),
                     ("Languages.csv", "Languages"),
                     ("Publications.csv", "Publications"),
                     ("Projects.csv", "Projects"),
                     ("Honors.csv", "Honors and awards"),
                     ("Patents.csv", "Patents")):
        rows = grab(f)
        if rows:
            parts.append(section(title, fmt_kv(rows)))

    # --- Social proof ---------------------------------------------------
    recs = grab("Recommendations_Received.csv")
    if recs:
        body = []
        for r in recs:
            who = " ".join(filter(None, [r.get("First Name"), r.get("Last Name")]))
            head = f"**From {who}**" if who else "**Recommendation**"
            if r.get("Company"):
                head += f" ({r['Company']})"
            body.append(f"{head}\n\n> " + r.get("Text", "").replace("\n", "\n> "))
        parts.append(section("Recommendations received", "\n\n".join(body)))

    learning = grab("Learning.csv")
    if learning:
        titles = []
        for row in learning[:LEARNING_LIMIT]:
            t = row.get("Content Title") or row.get("Title") or ""
            if t:
                titles.append(f"- {t}")
        extra = len(learning) - LEARNING_LIMIT
        body = "\n".join(titles)
        if extra > 0:
            body += f"\n- _(+{extra} more)_"
        parts.append(section(f"LinkedIn Learning (most recent {LEARNING_LIMIT})", body))

    # --- Long-form writing ----------------------------------------------
    articles = [n for n in src.names if "/Articles/" in n and n.endswith(".html")]
    if articles:
        body = "\n".join(f"- `{a}`" for a in sorted(articles))
        parts.append(section(
            "Articles written (read these files directly for content)", body))

    if skipped:
        parts.append(section("Not present in export", "\n".join(f"- {s}" for s in skipped)))

    parts.append(section(
        "Deliberately not read",
        "Connections, messages, invitations, ad targeting, endorsements given, and "
        "recommendations given — these describe other people, not this career."))

    return "\n".join(p for p in parts if p)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("export", type=Path, help="LinkedIn export .zip or extracted directory")
    ap.add_argument("-o", "--out", type=Path, help="output file (default: stdout)")
    args = ap.parse_args()

    if not args.export.exists():
        raise SystemExit(f"error: {args.export} does not exist")

    src = Source(args.export)
    # Guard against the double-zipped exports LinkedIn sometimes produces.
    if src.zip and not src.find("Profile.csv"):
        inner = [n for n in src.names if n.lower().endswith(".zip")]
        if inner:
            data = io.BytesIO(src.zip.read(inner[0]))
            src.zip = zipfile.ZipFile(data)
            src.names = src.zip.namelist()

    digest = build_digest(src)

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(digest, encoding="utf-8")
        print(f"wrote {args.out} ({len(digest.splitlines())} lines)", file=sys.stderr)
    else:
        sys.stdout.write(digest)


if __name__ == "__main__":
    main()
