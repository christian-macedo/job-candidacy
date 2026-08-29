---
name: profile-import
description: Build or refresh profile/master-profile.md, the canonical career record, from a LinkedIn data export, an old resume, or a performance review. Use when the user asks to import, ingest, load, or refresh their career history or LinkedIn data, drops files into profile/sources/, or when master-profile.md is missing or out of date before tailoring a resume.
---

# Profile import

Turn raw career sources into `profile/master-profile.md` — the one file everything else
reads from. It is a **superset**: everything true about this career, whether or not it
belongs on any particular resume. Trimming happens at tailor time, never here.

## 1. Locate the sources

Check `profile/sources/` first. If it is empty, ask where the export is — LinkedIn
archives usually land in `~/Downloads` as `Basic_LinkedInDataExport_<date>.zip`. Copy the
file into `profile/sources/` before processing so the import is reproducible.

## 2. Run the LinkedIn parser

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/profile-import/scripts/linkedin_export.py" \
  profile/sources/<export>.zip -o profile/sources/linkedin-digest.md
```

Stdlib only, no install step. It reads an allowlist of career files and deliberately skips
`Connections.csv`, `messages.csv`, and `Invitations.csv` — those are other people's data.
Endorsements are collapsed to per-skill counts for the same reason.

Then read the digest. Also read any article HTML files it lists — they are the user's own
long-form writing and often the best evidence of how they think.

For non-LinkedIn sources (old resume PDF/docx, performance reviews), read the file
directly. PDFs go through the `pdf` skill; `.docx` through the `docx` skill.

## 3. Write or merge master-profile.md

If the file exists, **merge** — never regenerate from scratch. Existing evidence atoms keep
their IDs and their hand-edited wording; the import only adds what is genuinely new and
appends corrections. Anything the source contradicts goes to `## Open questions` rather
than being silently overwritten.

### Structure

```markdown
# Master Profile — <Full Name>

## Contact
- **Location:** …
- **Email:** …          ← the address to publish, not every address in the export
- **Phone:** …
- **LinkedIn / Site / GitHub:** …

## Positioning
**Headline:** …
**Target roles:** …
**Summary (long):** two or three sentences of the fullest version.

## Experience

### [NWL] Engineering Manager · Northwind Logistics
Portland, OR · Jan 2021 – Jul 2026
**Scope:** team size, budget, systems owned, users served.
**Context:** one line on what the product actually was, for a reader who has never heard of it.

- [NWL-01] Grew the platform fleet from 6 to 72 clusters with a team of 6. | skills: Kubernetes, capacity planning | metric: 12x footprint, flat headcount
- [NWL-02] … | skills: … | metric: …

## Skills inventory
| Skill | Depth | Last used | Evidence |
|---|---|---|---|
| Kubernetes / EKS | deep | 2026 | NWL-01, NWL-05 |

## Education
## Certifications
## Publications, talks and writing
## Recognition and recommendations
## Open questions
```

### Evidence atoms are the point

Every accomplishment becomes one atom with a stable ID (`<ORG>-<NN>`, see
[conventions.md](${CLAUDE_PLUGIN_ROOT}/reference/conventions.md)). Rules:

- **No em dashes in atom text.** Atoms get rewritten into resume bullets, so an em dash here
  leaks into a recruiter-facing document later. Use `none` for an absent metric rather than a
  dash. See [ats-rules.md](../resume-tailor/references/ats-rules.md).
- **One claim per atom.** LinkedIn descriptions are run-on paragraphs; split them.
- **Keep the number.** Scale, cost, latency, headcount, uptime — if the source has a
  figure, the atom keeps it verbatim. If it doesn't, leave it out and note it in
  `## Open questions`; do not estimate one.
- **Tag with skills**, using the words the user actually uses. The tags are what
  `resume-tailor` searches against.
- **IDs are permanent.** Never renumber. A superseded atom gets struck through with a
  note, not deleted.
- **Preserve confidentiality boundaries.** If a source describes something under NDA or
  names an unreleased product, keep the atom but generalize the identifier the way the
  user's own LinkedIn summary already does ("a major consumer gaming platform").

### Things that belong in the profile but never on a resume

Birth date, full address, every historical email and phone number, government IDs. Capture
contact details the user would actually publish and drop the rest — the digest contains
more than a resume should ever carry.

## 4. Report gaps, don't paper over them

End by telling the user, briefly:

- Roles with dates but no accomplishments (LinkedIn exports are usually empty for older jobs)
- Fields the export left blank — a missing school name, a degree with no field of study
- Accomplishments with no metric attached
- Anything from the last 2–3 years that looks thinner than its importance warrants

Write these into `## Open questions` as well, so the next session can pick them up. Then
ask the user for the two or three that matter most for the roles they are targeting — a
short, specific list, not an interview.
